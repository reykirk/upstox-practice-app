const backendUrl =
  "https://jkupstox-backend.onrender.com";

async function loadHistoricalData() {
  const response = await fetch(
    `${backendUrl}/api/test-historical`
  );

  if (!response.ok) {
    throw new Error("Historical data could not be loaded");
  }

  const result = await response.json();
  return result.data?.candles || [];
}

document
  .getElementById("loadHistorical")
  .addEventListener("click", async () => {
    const status = document.getElementById("status");

    try {
      status.textContent = "Loading historical data...";
      const candles = await loadHistoricalData();
      status.textContent =
        `Loaded ${candles.length} historical candles.`;
      console.log(candles);
    } catch (error) {
      status.textContent = error.message;
    }
  });
