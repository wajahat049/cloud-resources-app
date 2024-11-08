import { NextRequest } from "next/server";
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { PubSub } from "graphql-subscriptions";
import { gql } from "graphql-tag";
import { CloudResource, resources } from "@/lib/constants";

const pubsub = new PubSub();
const RESOURCE_UPDATED = "RESOURCE_UPDATED";

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
      if (filter) {
        filteredResources = filteredResources.filter(
          (r) => r.status === filter
        );
      }
      if (search) {
        filteredResources = filteredResources.filter((r) =>
          r.name.toLowerCase().includes(search.toLowerCase())
        );
      }
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

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => ({ req }),
});

export { handler as GET, handler as POST };
