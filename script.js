const BACKEND =
  "https://jkupstox-backend.onrender.com";

let chart;

const $ = id => document.getElementById(id);

async function callBackend(path) {
  const response = await fetch(BACKEND + path);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.errors?.[0]?.message ||
      result.error ||
      `Request failed: ${response.status}`
    );
  }

  return result;
}

async function checkConnection() {
  try {
    const result = await callBackend("/api/status");

    $("status").textContent = result.connected
      ? " Connected"
      : " Not connected";
  } catch (error) {
    $("status").textContent = error.message;
  }
}

$("connect").onclick = () => {
  location.href = BACKEND + "/auth/upstox/login";
};

$("load").onclick = async () => {
  try {
    $("status").textContent =
      "Loading real historical data...";

    const instrumentKey =
      encodeURIComponent(
        $("instrument").value.trim()
      );

    const numberOfDays =
      Number($("days").value || 30);

    const to = new Date();

    const from = new Date(
      Date.now() - numberOfDays * 86400000
    );

    const formatDate = date =>
      date.toISOString().slice(0, 10);

    const result = await callBackend(
      `/api/historical?` +
      `instrument_key=${instrumentKey}` +
      `&unit=days` +
      `&interval=1` +
      `&to=${formatDate(to)}` +
      `&from=${formatDate(from)}`
    );

    const candles = result.data?.candles || [];

    if (!candles.length) {
      throw new Error(
        "Upstox returned no candles."
      );
    }

    const orderedCandles =
      candles.slice().reverse();

    if (chart) {
      chart.destroy();
    }

    chart = new Chart(
      $("chart"),
      {
        type: "line",
        data: {
          labels: orderedCandles.map(
            candle => candle[0]
          ),
          datasets: [
            {
              label: "Real close price",
              data: orderedCandles.map(
                candle => candle[4]
              ),
              borderColor: "#22c55e",
              tension: 0.15
            }
          ]
        },
        options: {
          responsive: true
        }
      }
    );

    $("status").textContent =
      `Loaded ${candles.length} real candles`;
  } catch (error) {
    $("status").textContent = error.message;
  }
};

$("chain").onclick = async () => {
  try {
    const expiry = $("expiry").value;

    if (!expiry) {
      throw new Error(
        "Select a valid expiry date."
      );
    }

    const instrumentKey =
      encodeURIComponent(
        $("instrument").value.trim()
      );

    const result = await callBackend(
      `/api/option-chain?` +
      `instrument_key=${instrumentKey}` +
      `&expiry_date=${expiry}`
    );

    $("chainOut").textContent =
      JSON.stringify(
        result.data || result,
        null,
        2
      );
  } catch (error) {
    $("chainOut").textContent =
      error.message;
  }
};

checkConnection();
