import { atom, useAtom } from "jotai";
import React, { FC, ReactNode, Suspense } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { createRoot } from "react-dom/client";

const idAtom = atom<number | null>(null);

interface ArticleBase {
  by: string;
  id: number;
  kids: number[];
  parent: number;
  time: number;
};

interface Story extends ArticleBase {
  type: "story";
  descendants: number;
  title: string;
  url: string;
}

interface Comment extends ArticleBase {
  type: "comment";
  text: string;
}

function fetchTopStories(): Promise<number[]> {
  return fetch(`https://hacker-news.firebaseio.com/v0/topstories.json`).then(it => it.json());
}

function fetchArticle(id: number): Promise<Article> {
  return fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(it => it.json())
}

type Article = Story | Comment;
const topStoriesAtom = atom(() => fetchTopStories().then(ids => Promise.all(ids.slice(0, 10).map(id => fetchArticle(id)))))

const TopStories = () => {
  const [_, setId] = useAtom(idAtom);
  const [articles] = useAtom(topStoriesAtom);
  return (
    <ul>
      {(articles as Story[]).map(article =>
        <li>
          <a onClick={() => setId(article.id)}>{article.title}</a>(<a href={article.url}>{new URL(article.url ?? "http://example.com").hostname}</a>)
        </li>
      )}
    </ul>
  );
}

const Story: FC<{ story: Story }> = ({ story }) => {
  const [_, setId] = useAtom(idAtom);
  return (
    <div>
      <p><a onClick={()=> setId(story.descendants)}>←</a></p>
      <a href={story.url} dangerouslySetInnerHTML={{__html: story.title}}></a>
    </div>
  )
}


const Comment: FC<{ comment: Comment }> = ({ comment }) => {
  return (
    <div>
      <p dangerouslySetInnerHTML={{__html: comment.text}}/>
    </div>
  );
}

const Main = () => {
  return (
    <main>
      <TopStories />
    </main>
  );
}



const App: FC = () => {
  return (
    <div>
      <Header />
      <Suspense fallback={"loading..."}>
        <Main />
      </Suspense>
      <Footer />
    </div>
  );
}

function when<T, U>(caseParameter: T) {
  function innerWhen() {
    return {
      case(param: T, fn: () => U) {
        map.set(param, fn);
        return innerWhen();
      },
      then(): U {
        return map.get(caseParameter)?.()!;
      }
    }
  }


  const map = new Map<T, () => U>();
  return innerWhen();
}

const root = createRoot(document.body);
root.render(<App/>)