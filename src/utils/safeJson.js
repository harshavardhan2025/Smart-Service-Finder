// Parse API response safely — falls back gracefully when backend returns non-JSON
const safeJson = async (response) => {
  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) return response.json();
  const text = await response.text();
  console.error("Non-JSON response:", text.slice(0, 200));
  return { error: "Server is unreachable – please try again shortly." };
};

export default safeJson;
