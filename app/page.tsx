"use client";
// import ResourceList from "../components/ResourceList";
import client from "../lib/apollo-client";
import { ApolloProvider } from "@apollo/client";
import dynamic from "next/dynamic";

const ResourceList = dynamic(() => import("../components/ResourceList"), {
  ssr: false,
});

export default function Home() {
  return (
    <ApolloProvider client={client}>
      <main>
        <ResourceList />
      </main>
    </ApolloProvider>
  );
}
