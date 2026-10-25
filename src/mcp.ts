import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadCatalog, byPhase, mcpConfigFor, validateCatalog } from "./catalog.js";
import { doctor, productionChecklist } from "./doctor.js";

export async function runMcp(): Promise<void> {
  const server = new McpServer({ name: "prodforge", version: "0.4.0" });

  server.tool("list_packages", "List every package ProdForge can wire together, optionally by production phase.", {
    phase: z.enum(["build", "secure", "test", "release", "operate"]).optional(),
  }, async ({ phase }) => {
    const catalog = loadCatalog();
    const tools = phase ? byPhase(catalog, phase as never) : catalog.tools;
    return { content: [{ type: "text", text: JSON.stringify(tools, null, 2) }] };
  });

  server.tool("connect_config", "Return one merged MCP config wiring every shipped MCP server together.", {}, async () => {
    const catalog = loadCatalog();
    return { content: [{ type: "text", text: JSON.stringify(mcpConfigFor(catalog.tools), null, 2) }] };
  });

  server.tool("production_checklist", "The full production checklist, grouped by phase, with the tool that runs each step.", {}, async () => {
    return { content: [{ type: "text", text: JSON.stringify(productionChecklist(), null, 2) }] };
  });

  server.tool("doctor_report", "Run local production-readiness checks on the current project.", {}, async () => {
    return { content: [{ type: "text", text: JSON.stringify(doctor(), null, 2) }] };
  });

  server.tool("ship_gate", "Run the release gate: executes each installed fleet tool in the given directory, reports ABSENT when missing, never fakes a PASS.", {
    dir: z.string().optional(),
  }, async ({ dir }) => {
    const { runShip } = await import("./ship.js");
    return { content: [{ type: "text", text: JSON.stringify(runShip(dir ?? process.cwd()), null, 2) }] };
  });

  server.tool("catalog_health", "Validate the ProdForge catalog itself: duplicates, missing fields, bad phases.", {}, async () => {
    const catalog = loadCatalog();
    const problems = validateCatalog(catalog);
    return { content: [{ type: "text", text: JSON.stringify({ tools: catalog.tools.length, problems }, null, 2) }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
