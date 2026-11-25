import { createFileRoute } from "@tanstack/react-router";

const description =
  "Criação de sites profissionais com hospedagem, infraestrutura, manutenção técnica e suporte. Sua empresa online sem complicação com a ORYZON CODE.";
const title =
  "ORYZON CODE | Sites Profissionais e Presença Digital Gerenciada";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "author", content: "ORYZON CODE" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="h-svh w-full overflow-hidden bg-[#05070A]">
      <iframe
        title="ORYZON CODE — Presença digital gerenciada"
        src="/oryzon-code.html"
        className="block h-full w-full border-0"
      />
    </main>
  );
}
