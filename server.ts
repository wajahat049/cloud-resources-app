import { createServer } from "http";
import { WebSocketServer } from "ws";
import next from "next";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { CloudResource, resources } from "./lib/constants";
import { PubSub } from "graphql-subscriptions";
import { gql } from "graphql-tag"; // Use `graphql-tag` directly for typeDefs in backend

const pubsub = new PubSub();
const RESOURCE_UPDATED = "RESOURCE_UPDATED";
// import { typeDefs, resolvers } from "./app/api/graphql/route";

const typeDefs = gql`
  type CloudResource {
    id: ID!
    name: String!
    type: String!
    status: String!
  }

  type Query {
    getCloudResources(filter: String, search: String): [CloudResource!]!
  }

  type Subscription {
    resourceUpdated: CloudResource
  }

  type Mutation {
    updateResource(
      id: ID!
      name: String
      type: String
      status: String
    ): CloudResource
  }
`;

const resolvers = {
  Query: {
    getCloudResources: (
      _: unknown,
      { filter, search }: { filter?: string; search?: string }
    ) => {
      let filteredResources = resources;
      if (filter)
        filteredResources = filteredResources.filter(
          (r) => r.status === filter
        );
      if (search)
        filteredResources = filteredResources.filter((r) =>
          r.name.toLowerCase().includes(search.toLowerCase())
        );
      return filteredResources;
    },
  },
  Mutation: {
    updateResource: (_: unknown, { id, name, type, status }: CloudResource) => {
      const index = resources.findIndex((r) => r.id === id);
      if (index === -1) throw new Error("Resource not found");
      const updatedResource = { ...resources[index], name, type, status };
      resources[index] = updatedResource;
      pubsub.publish(RESOURCE_UPDATED, { resourceUpdated: updatedResource });
      return updatedResource;
    },
  },
  Subscription: {
    resourceUpdated: {
      subscribe: () => pubsub.asyncIterator([RESOURCE_UPDATED]),
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: process.env.NODE_ENV !== "production" });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));

  const wsServer = new WebSocketServer({
    server,
    path: "/api/graphql",
  });

  useServer({ schema }, wsServer);

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
