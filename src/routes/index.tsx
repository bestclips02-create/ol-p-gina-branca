import { createFileRoute } from "@tanstack/react-router";
import { Studio } from "../components/clip-studio";

const title = "InfectadoZ Clip Studio | Editor de vídeos de gameplay";
const description = "Crie clips de gameplay, ajuste o áudio, aplique efeitos visuais e baixe seus vídeos com a identificação do servidor InfectadoZ.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Studio,
});

