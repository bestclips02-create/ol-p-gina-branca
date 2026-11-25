import { createFileRoute } from "@tanstack/react-router";
import { Studio } from "../components/clip-studio";

export const Route = createFileRoute("/studio")({ component: Studio });
