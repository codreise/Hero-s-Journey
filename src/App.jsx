import React from "react";
import Game from "./pages/Game";
import { TelegramMiniAppProvider } from "./lib/telegram-mini-app";

export default function App() {
	return (
		<TelegramMiniAppProvider>
			<Game />
		</TelegramMiniAppProvider>
	);
}
