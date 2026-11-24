import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oi" },
      { name: "description", content: "Uma página branca dizendo oi." },
      { property: "og:title", content: "Oi" },
      { property: "og:description", content: "Uma página branca dizendo oi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <h1 className="text-6xl font-semibold text-foreground">oi</h1>
    </main>
  );
}
