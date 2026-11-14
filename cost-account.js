import { getAccountClient, authError } from "./auth-client.js";

const table = "product_cost_history";

export async function connectCostAccount(onChange) {
  const expiredLink = new URLSearchParams(location.hash.slice(1)).get("error_code") === "otp_expired";
  const client = await getAccountClient();
  const panel = document.getElementById("costAccount");
  const passwordForm = document.getElementById("passwordForm");
  const message = document.getElementById("accountMessage");
  const priceMessage = document.getElementById("priceLoadMessage");
  const logout = document.getElementById("logout");
  const retry = document.getElementById("reloadCosts");
  const setPassword = document.getElementById("showSetPassword");
  let owner, generation = 0;
  async function load() {
    const version = ++generation;
    retry.hidden = true;
    if (!owner) return;
    priceMessage.textContent = "Kayıtlı alış fiyatları yükleniyor…";
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
      priceMessage.textContent = "";
    } catch {
      if (version !== generation) return;
      priceMessage.textContent = "Kayıtlı fiyatlar yüklenemedi. Bağlantıyı kontrol edip tekrar deneyin.";
      retry.hidden = false;
    }
  }
  function showPasswordForm(open) {
    passwordForm.reset();
    passwordForm.hidden = !open;
    setPassword.hidden = open;
    message.textContent = "";
    if (open) {
      panel.open = true;
      passwordForm.elements.password.focus();
    }
  }
  setPassword.onclick = () => showPasswordForm(true);
  document.getElementById("cancelPassword").onclick = () => showPasswordForm(false);

  client.auth.onAuthStateChange((event, session) => {
    const next = session?.user.id ?? null;
    if (owner !== next) {
      ++generation;
      owner = next;
      onChange(owner, null);
      showPasswordForm(false);
      panel.hidden = !owner;
      if (owner && location.hash === "#costAccount") panel.open = true;
      document.getElementById("reportGuest").hidden = Boolean(owner);
      document.getElementById("memberActions").hidden = !owner;
      document.getElementById("accountCaption").textContent = session?.user.email || "";
      priceMessage.textContent = "";
      retry.hidden = true;
      // Start database calls after the auth callback releases its session lock.
      if (owner) setTimeout(load, 0);
    }
    if (event === "PASSWORD_RECOVERY" && owner) showPasswordForm(true);
    if (event === "INITIAL_SESSION" && expiredLink && !owner) {
      location.replace("/giris?islem=baglanti");
    }
  });
  passwordForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = passwordForm.querySelector("[type=submit]");
    if (button.disabled || !owner) return;
    const account = owner;
    button.disabled = true;
    document.getElementById("cancelPassword").disabled = true;
    message.textContent = "";
    try {
      const {error} = await client.auth.updateUser({password: passwordForm.elements.password.value});
      if (error) throw error;
      if (account !== owner) return;
      showPasswordForm(false);
      message.textContent = "Şifreniz kaydedildi. Sonraki girişte e-posta adresinizi ve bu şifreyi kullanabilirsiniz.";
    } catch (error) {
      if (account === owner) message.textContent = authError(error, "update");
    } finally {
      button.disabled = false;
      document.getElementById("cancelPassword").disabled = false;
    }
  });
  logout.addEventListener("click", async () => {
    const {error} = await client.auth.signOut({scope: "local"});
    if (error) message.textContent = "Çıkış yapılamadı. Tekrar deneyin.";
  });
  retry.addEventListener("click", load);
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
