"use client";

import { useEffect, useState } from "react";

type Post = {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  symbol: string;
  direction: "LONG" | "SHORT" | "GENERAL";
  likes: number;
  liked: boolean;
  comments: number;
  createdAt: string;
};

const STORAGE_KEY = "tradevault-lounge-posts";

const DEFAULT_POSTS: Post[] = [
  {
    id: "1",
    author: "TradeVault Trader",
    avatar: "TV",
    title: "Welcome to Traders Lounge 🚀",
    content:
      "Welcome to the TradeVault trading community. Share your setups, ideas, lessons and trading experiences here.",
    symbol: "GENERAL",
    direction: "GENERAL",
    likes: 12,
    liked: false,
    comments: 4,
    createdAt: "Just now",
  },
  {
    id: "2",
    author: "Smart Money Trader",
    avatar: "SM",
    title: "Gold looking interesting today",
    content:
      "Watching XAUUSD around the key level. Waiting for confirmation before taking a position. No chasing trades.",
    symbol: "XAUUSD",
    direction: "LONG",
    likes: 8,
    liked: false,
    comments: 3,
    createdAt: "12 min ago",
  },
];

export default function TradersLoungePage() {
  const [posts, setPosts] =
    useState<Post[]>(DEFAULT_POSTS);

  const [loaded, setLoaded] =
    useState(false);

  const [showCreate, setShowCreate] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [content, setContent] =
    useState("");

  const [symbol, setSymbol] =
    useState("GENERAL");

  const [direction, setDirection] =
    useState<"LONG" | "SHORT" | "GENERAL">(
      "GENERAL"
    );

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("ALL");

  // Load posts
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setPosts(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Error loading lounge posts:",
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save posts
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(posts)
      );
    } catch (error) {
      console.error(
        "Error saving lounge posts:",
        error
      );
    }
  }, [posts, loaded]);

  function createPost() {
    if (!title.trim() || !content.trim()) {
      return;
    }

    const newPost: Post = {
      id: Date.now().toString(),
      author: "You",
      avatar: "YO",
      title: title.trim(),
      content: content.trim(),
      symbol,
      direction,
      likes: 0,
      liked: false,
      comments: 0,
      createdAt: "Just now",
    };

    setPosts((current) => [
      newPost,
      ...current,
    ]);

    setTitle("");
    setContent("");
    setSymbol("GENERAL");
    setDirection("GENERAL");
    setShowCreate(false);
  }

  function toggleLike(id: string) {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== id) {
          return post;
        }

        return {
          ...post,
          liked: !post.liked,
          likes: post.liked
            ? post.likes - 1
            : post.likes + 1,
        };
      })
    );
  }

  const filteredPosts = posts.filter(
    (post) => {
      const matchesSearch =
        post.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        post.content
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        post.symbol
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "ALL" ||
        post.symbol === filter ||
        post.direction === filter;

      return (
        matchesSearch && matchesFilter
      );
    }
  );

  return (
    <main className="min-h-screen bg-[#0d1117] text-white p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Traders Lounge
          </h1>

          <p className="text-gray-500 mt-1">
            Share ideas, setups and trading
            experiences with other traders.
          </p>
        </div>

        <button
          onClick={() =>
            setShowCreate(true)
          }
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg font-medium transition"
        >
          + Create Post
        </button>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-sm">
            Community Posts
          </p>

          <p className="text-2xl font-bold mt-2">
            {posts.length}
          </p>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-sm">
            Total Likes
          </p>

          <p className="text-2xl font-bold mt-2">
            {posts.reduce(
              (total, post) =>
                total + post.likes,
              0
            )}
          </p>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-sm">
            Your Posts
          </p>

          <p className="text-2xl font-bold mt-2">
            {
              posts.filter(
                (post) =>
                  post.author === "You"
              ).length
            }
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search posts, setups or symbols..."
            className="flex-1 bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            className="bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-2.5 text-sm outline-none"
          >
            <option value="ALL">
              All Posts
            </option>
            <option value="XAUUSD">
              XAUUSD
            </option>
            <option value="EURUSD">
              EURUSD
            </option>
            <option value="BTCUSD">
              BTCUSD
            </option>
            <option value="LONG">
              Long
            </option>
            <option value="SHORT">
              Short
            </option>
          </select>
        </div>
      </div>

      {/* Create Post */}
      {showCreate && (
        <div className="bg-[#161b22] border border-blue-500/30 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">
              Create Post
            </h2>

            <button
              onClick={() =>
                setShowCreate(false)
              }
              className="text-gray-500 hover:text-white text-xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Post title"
              className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="Share your trading idea, setup or lesson..."
              rows={5}
              className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={symbol}
                onChange={(event) =>
                  setSymbol(event.target.value)
                }
                className="bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none"
              >
                <option value="GENERAL">
                  General
                </option>
                <option value="XAUUSD">
                  XAUUSD
                </option>
                <option value="EURUSD">
                  EURUSD
                </option>
                <option value="GBPUSD">
                  GBPUSD
                </option>
                <option value="USDJPY">
                  USDJPY
                </option>
                <option value="BTCUSD">
                  BTCUSD
                </option>
              </select>

              <select
                value={direction}
                onChange={(event) =>
                  setDirection(
                    event.target.value as
                      | "LONG"
                      | "SHORT"
                      | "GENERAL"
                  )
                }
                className="bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none"
              >
                <option value="GENERAL">
                  General
                </option>
                <option value="LONG">
                  🟢 Long Setup
                </option>
                <option value="SHORT">
                  🔴 Short Setup
                </option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setShowCreate(false)
                }
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={createPost}
                disabled={
                  !title.trim() ||
                  !content.trim()
                }
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-5 py-2 rounded-lg text-sm font-medium"
              >
                Publish Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="max-w-4xl space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-10 text-center">
            <p className="text-gray-400">
              No posts found.
            </p>

            <p className="text-gray-600 text-sm mt-2">
              Try another search or create a
              new post.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-[#161b22] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition"
            >
              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold text-sm">
                  {post.avatar}
                </div>

                <div>
                  <p className="font-medium text-sm">
                    {post.author}
                  </p>

                  <p className="text-xs text-gray-600">
                    {post.createdAt}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {post.symbol !==
                  "GENERAL" && (
                  <span className="px-2.5 py-1 bg-gray-800 rounded-md text-xs text-gray-300">
                    {post.symbol}
                  </span>
                )}

                {post.direction ===
                  "LONG" && (
                  <span className="px-2.5 py-1 bg-green-500/10 text-green-400 rounded-md text-xs">
                    LONG
                  </span>
                )}

                {post.direction ===
                  "SHORT" && (
                  <span className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-md text-xs">
                    SHORT
                  </span>
                )}
              </div>

              {/* Content */}
              <h2 className="text-lg font-semibold mb-2">
                {post.title}
              </h2>

              <p className="text-gray-400 text-sm leading-6">
                {post.content}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-800">
                <button
                  onClick={() =>
                    toggleLike(post.id)
                  }
                  className={`flex items-center gap-2 text-sm transition ${
                    post.liked
                      ? "text-blue-400"
                      : "text-gray-500 hover:text-blue-400"
                  }`}
                >
                  {post.liked
                    ? "♥"
                    : "♡"}{" "}
                  {post.likes}
                </button>

                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-white">
                  💬 {post.comments}
                </button>

                <button className="text-sm text-gray-500 hover:text-white">
                  Share
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}