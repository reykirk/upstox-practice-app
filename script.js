const BACKEND =
  "https://jkupstox-backend.onrender.com";

let chart;
let liveStream;

const $ = id => document.getElementById(id);

async function request(path) {
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

async function checkStatus() {
  try {
    const result = await request("/api/status");

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

$("historical").onclick = async () => {
  try {
    $("status").textContent =
      "Loading real historical data...";

    const key = encodeURIComponent(
      $("histKey").value.trim()
    );

    const days = Number($("days").value || 30);
    const unit = $("unit").value;

    const to = new Date();
    const from = new Date(
      Date.now() - days * 86400000
    );

    const date = d => d.toISOString().slice(0, 10);

    const result = await request(
      `/api/historical?` +
      `instrument_key=${key}` +
      `&unit=${unit}` +
      `&interval=1` +
      `&to=${date(to)}` +
      `&from=${date(from)}`
    );

    const candles = result.data?.candles || [];

    if (!candles.length) {
      throw new Error(
        "Upstox returned no historical candles."
      );
    }

    const ordered = candles.slice().reverse();

    if (chart) chart.destroy();

    chart = new Chart($("chart"), {
      type: "line",
      data: {
        labels: ordered.map(candle => candle[0]),
        datasets: [{
          label: "Real close price",
          data: ordered.map(candle => candle[4]),
          borderColor: "#16a34a"
        }]
      },
      options: {
        responsive: true
      }
    });

    $("status").textContent =
      `Loaded ${candles.length} real candles`;
  } catch (error) {
    $("status").textContent = error.message;
  }
};

$("chain").onclick = async () => {
  try {
    const key = encodeURIComponent(
      $("chainKey").value.trim()
    );

    const expiry = encodeURIComponent(
      $("expiry").value.trim()
    );

    const result = await request(
      `/api/option-chain?` +
      `instrument_key=${key}` +
      `&expiry_date=${expiry}`
    );

    $("output").textContent =
      JSON.stringify(
        result.data || result,
        null,
        2
      );
  } catch (error) {
    $("output").textContent = error.message;
  }
};

$("live").onclick = () => {
  if (liveStream) {
    liveStream.close();
  }

  const key = encodeURIComponent(
    $("liveKey").value.trim()
  );

  $("ltp").textContent =
    "Waiting for live tick...";

  liveStream = new EventSource(
    `${BACKEND}/api/live?instrument_keys=${key}`
  );

  liveStream.onmessage = event => {
    try {
      const message = JSON.parse(event.data);
      const feed =
        Object.values(message.feeds || {})[0];

      const ltp = feed?.ltpc?.ltp;

      if (ltp !== undefined) {
        $("ltp").textContent =
          `Live LTP: ${ltp}`;
      }
    } catch (error) {
      $("ltp").textContent =
        "Live data decoding error";
    }
  };

  liveStream.onerror = () => {
    $("ltp").textContent =
      "Live feed disconnected";
  };
};

checkStatus();
