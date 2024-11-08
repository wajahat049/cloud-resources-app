"use client";

import { useQuery, useSubscription } from "@apollo/client";
import { useState, useCallback, useEffect } from "react";
import gql from "graphql-tag";
import debounce from "lodash.debounce";

type CloudResource = {
  id: string;
  name: string;
  type: string;
  status: string;
};

const GET_RESOURCES = gql`
  query GetCloudResources($filter: String, $search: String) {
    getCloudResources(filter: $filter, search: $search) {
      id
      name
      type
      status
    }
  }
`;

const RESOURCE_UPDATED = gql`
  subscription ResourceUpdated {
    resourceUpdated {
      id
      name
      type
      status
    }
  }
`;

const Search = ({ search, setSearch, filter, setFilter, handleSearch }) => {
  return (
    <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="w-full">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-300 focus:outline-none text-black"
        />
        <button
          onClick={handleSearch}
          className="ml-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
        >
          Search
        </button>
      </div>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-300 focus:outline-none text-black"
      >
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
};

const ResourceList = () => {
  const [filter, setFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const { data, refetch, loading } = useQuery<{
    getCloudResources: CloudResource[];
  }>(GET_RESOURCES, {
    variables: { filter: "", search: "" }, // Default initial fetch
  });

  useSubscription<{ resourceUpdated: CloudResource }>(RESOURCE_UPDATED, {
    onData: ({ client, data }) => {
      const updatedResource = data?.data?.resourceUpdated;
      if (updatedResource) {
        client.cache.modify({
          fields: {
            getCloudResources(existingResources = []) {
              return existingResources.map((res) =>
                res.__ref === `CloudResource:${updatedResource.id}`
                  ? { ...res, ...updatedResource }
                  : res
              );
            },
          },
        });
      }
    },
  });

  // Debounced refetch to optimize input-based queries
  const handleSearch = useCallback(
    debounce(() => {
      refetch({ filter, search });
    }, 300),
    [filter, search, refetch]
  );

  useEffect(() => {
    if (search == "") {
      refetch({ filter, search });
    }
  }, [search]);

  useEffect(() => {
    if (filter != "") {
      refetch({ filter, search });
    }
  }, [filter]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Search
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        handleSearch={handleSearch}
      />
      <ul className="bg-white rounded-lg shadow-lg p-4 divide-y divide-gray-200">
        {data?.getCloudResources.map((resource) => (
          <li
            key={resource.id}
            className="py-3 flex justify-between items-center"
          >
            <div>
              <p className="text-lg font-medium text-gray-900">
                {resource.name}
              </p>
              <p className="text-sm text-gray-500">{resource.type}</p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-lg ${
                resource.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {resource.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResourceList;
