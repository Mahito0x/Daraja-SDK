export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h1>🚀 Daraja app is running</h1>
      <p>
        Your M-Pesa routes live under <code>app/api/</code> — check that
        folder for whichever services you selected during setup.
      </p>
      <p>
        Fill in your real credentials in <code>.env</code> before going live.
      </p>
    </main>
  );
}
