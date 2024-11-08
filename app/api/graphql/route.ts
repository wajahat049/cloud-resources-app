// File: app/api/graphql/route.ts
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { PubSub } from "graphql-subscriptions";
import { gql } from "graphql-tag";
import { NextRequest } from "next/server";

const pubsub = new PubSub();
const RESOURCE_UPDATED = "RESOURCE_UPDATED";

type UpdateResourceArgs = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
};

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
      // Dummy logic to simulate filtering and searching
      const resources = [
        { id: "1", name: "AWS EC2", type: "Compute", status: "active" },
        {
          id: "2",
          name: "Google Cloud Storage",
          type: "Storage",
          status: "inactive",
        },
        { id: "3", name: "Azure VM", type: "Compute", status: "active" },
        { id: "4", name: "AWS S3", type: "Storage", status: "active" },
        {
          id: "5",
          name: "Google Kubernetes Engine",
          type: "Container",
          status: "active",
        },
        {
          id: "6",
          name: "Azure Blob Storage",
          type: "Storage",
          status: "inactive",
        },
        { id: "7", name: "AWS Lambda", type: "Compute", status: "active" },
        {
          id: "8",
          name: "Google BigQuery",
          type: "Database",
          status: "inactive",
        },
        {
          id: "9",
          name: "Azure SQL Database",
          type: "Database",
          status: "active",
        },
        { id: "10", name: "AWS RDS", type: "Database", status: "active" },
        {
          id: "11",
          name: "Google Cloud Functions",
          type: "Compute",
          status: "inactive",
        },
        {
          id: "12",
          name: "Azure Functions",
          type: "Compute",
          status: "active",
        },
        {
          id: "13",
          name: "AWS DynamoDB",
          type: "Database",
          status: "inactive",
        },
        {
          id: "14",
          name: "Google Cloud Run",
          type: "Container",
          status: "active",
        },
        {
          id: "15",
          name: "Azure Kubernetes Service",
          type: "Container",
          status: "active",
        },
        {
          id: "16",
          name: "AWS Elastic Beanstalk",
          type: "Compute",
          status: "active",
        },
        {
          id: "17",
          name: "Google Firestore",
          type: "Database",
          status: "inactive",
        },
        {
          id: "18",
          name: "Azure Cosmos DB",
          type: "Database",
          status: "active",
        },
        { id: "19", name: "AWS Glacier", type: "Storage", status: "inactive" },
        {
          id: "20",
          name: "Google Cloud Spanner",
          type: "Database",
          status: "active",
        },
      ];
      return resources.filter(
        (resource) =>
          (!filter || resource.status === filter) &&
          (!search ||
            resource.name.toLowerCase().includes(search.toLowerCase()))
      );
    },
  },
  Mutation: {
    updateResource: (
      _: unknown,
      { id, name, type, status }: UpdateResourceArgs
    ) => {
      // Dummy mutation logic for now
      return { id, name, type, status };
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
  context: async (req: NextRequest) => ({ req }), // Provide request context
});

export const GET = handler;
export const POST = handler;
