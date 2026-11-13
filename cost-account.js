const projectUrl = "https://uuiuondxieynhzjzfcis.supabase.co";
const publicKey = "sb_publishable_wWJjYdryJpsRQF0x3dSJHA_8wGfNUBV";
const table = "product_cost_history";

export async function connectCostAccount(onChange) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("./vendor/supabase-2.119.0.js", import.meta.url);
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
  const client = window.supabase.createClient(projectUrl, publicKey);
  const panel = document.getElementById("costAccount");
  const form = document.getElementById("loginForm");
  const message = document.getElementById("accountMessage");
  const logout = document.getElementById("logout");
  const retry = document.getElementById("reloadCosts");
  let owner, generation = 0;
  function status(text) { message.textContent = text; }
  async function load() {
    const version = ++generation;
    retry.hidden = true;
    if (!owner) return;
    status("Kayıtlı alış fiyatları yükleniyor…");
    const history = new Map();
    try {
      for (let offset = 0; ; offset += 500) {
        const {data, error} = await client.from(table).select("product_key,valid_from,cost_cents,vat_rate")
          .eq("user_id", owner).order("product_key").order("valid_from", {ascending: false}).range(offset, offset + 499);
        if (version !== generation) return;
        if (error) throw error;
        for (const row of data) {
          if (!history.has(row.product_key)) history.set(row.product_key, []);
          history.get(row.product_key).push(row);
        }
        if (data.length < 500) break;
      }
      onChange(owner, history);
      status("");
    } catch {
      if (version !== generation) return;
      status("Kayıtlı fiyatlar yüklenemedi. Bağlantıyı kontrol edip tekrar deneyin.");
      retry.hidden = false;
    }
  }
  client.auth.onAuthStateChange((_event, session) => {
    const next = session?.user.id ?? null;
    if (owner === next) return;
    ++generation;
    owner = next;
    onChange(owner, null);
    form.hidden = Boolean(owner);
    logout.hidden = !owner;
    document.getElementById("accountTitle").textContent = owner ? "Hesabım · " + session.user.email : "Giriş yap ve alış fiyatlarını hatırla";
    status("");
    // Start database calls after the auth callback has released its session lock.
    setTimeout(load, 0);
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const {error} = await client.auth.signInWithOtp({email: form.elements.email.value.trim(),
        options: {emailRedirectTo: location.origin + "/satislar"}});
      if (error) throw error;
      status("Giriş bağlantısını e-posta adresinize gönderdik. Bağlantıyı bu tarayıcıda açın.");
    } catch (error) {
      status(error.status === 429 ? "Çok sık deneme yapıldı. Biraz sonra tekrar deneyin." : "Giriş e-postası gönderilemedi. Adresi kontrol edip tekrar deneyin.");
    } finally { button.disabled = false; }
  });
  logout.addEventListener("click", async () => {
    const {error} = await client.auth.signOut({scope: "local"});
    if (error) status("Çıkış yapılamadı. Tekrar deneyin.");
  });
  retry.addEventListener("click", load);
  panel.hidden = false;
  return async function save(record, expectedOwner) {
    if (!owner || expectedOwner !== owner) throw Error("Hesap değişti. Fiyatı yeniden açın.");
    const {error} = await client.from(table).upsert({...record, user_id: expectedOwner},
      {onConflict: "user_id,product_key,valid_from"});
    if (error) throw Error("Fiyat kaydedilemedi. Bağlantıyı kontrol edip tekrar deneyin.");
    if (owner !== expectedOwner) throw Error("Hesap değişti. Fiyatı yeniden açın.");
    onChange(owner, null);
    await load();
  };
}
