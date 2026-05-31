import { Widget } from "safe-stake-widget";

export default function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">SAFE Staking</h1>
      <Widget theme="light" mode="standalone" />
    </main>
  );
}
