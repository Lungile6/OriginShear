const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;

async function querySubgraph(query, variables = {}) {
  if (!GRAPHQL_ENDPOINT) {
    const err = new Error("GRAPHQL_ENDPOINT is not configured");
    err.status = 500;
    throw err;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const err = new Error(`Subgraph request failed with status ${response.status}`);
    err.status = 502;
    throw err;
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    const err = new Error(payload.errors[0].message || "Subgraph query failed");
    err.status = 502;
    throw err;
  }

  return payload.data;
}

module.exports = { querySubgraph };
