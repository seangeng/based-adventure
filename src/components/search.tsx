"use client";
import { useState } from "react";

interface SearchResult {
  fid: string;
  user: {
    pfp_url: string;
    username: string;
  };
  nft: {
    thumbnail: string;
  };
  class: string;
  level: number;
}

const SearchComponent = () => {
  const [searchResults, setSearchResults] = useState([] as SearchResult[]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearching(true);

    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    const data = (await response.json()) as SearchResult[];
    console.log(data);

    setSearchResults(data);
    setSearching(false);
    setSearched(true);
  };

  return (
    <div className="flex-col">
      <form
        className="mt-6 flex max-w-md gap-x-4 m-auto"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(
            (document.getElementById("search") as HTMLInputElement).value
          );
        }}
      >
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <input
          id="search"
          name="search"
          type="text"
          autoComplete="search"
          required
          className="min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
          placeholder="Search by username"
        />
        <button
          type="submit"
          className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          Search
        </button>
      </form>
      {searching && (
        <p className="p-5 bg-slate-800 bg-opacity-50 border border-slate-700 rounded-lg my-6">
          Searching...
        </p>
      )}
      {searched && (
        <div className="my-5">
          <h2 className="text-slate-500 text-lg ">
            Search Results: {searchResults.length} users
          </h2>
          {searchResults.map((result: any) => (
            <a
              key={result.fid}
              className="p-5 bg-slate-800 bg-opacity-50 border border-slate-700 rounded-lg my-4 block w-full hover:bg-opacity-70 transition-colors duration-200 ease-in-out"
              href={`/profile/${result.user.username}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <img
                    src={result.nft?.thumbnail ?? result.user?.pfp_url ?? ""}
                    alt="User Profile Picture"
                    className="w-14 h-14 rounded-full"
                  />
                  <p className="text-white">{result.user.username}</p>
                </div>
                <p className="text-white">
                  {result.class} - Level {result.level}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
