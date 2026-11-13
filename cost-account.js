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
  const passwordForm = document.getElementById("passwordForm");
  const message = document.getElementById("accountMessage");
  const priceMessage = document.getElementById("priceLoadMessage");
  const logout = document.getElementById("logout");
  const retry = document.getElementById("reloadCosts");
  const submit = document.getElementById("authSubmit");
  const signup = document.getElementById("showSignup");
  const reset = document.getElementById("showReset");
  const back = document.getElementById("showLogin");
  const setPassword = document.getElementById("showSetPassword");
  const redirectTo = location.origin + "/satislar";
  const linkParams = new URLSearchParams(location.hash.slice(1));
  const expiredLink = linkParams.get("error_code") === "otp_expired";
  let mode = "login";
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
  function showMode(nextMode) {
    mode = nextMode;
    const password = form.elements.password;
    password.value = "";
    password.disabled = mode === "reset";
    password.autocomplete = mode === "signup" ? "new-password" : "current-password";
    const label = document.getElementById("passwordLabel");
    label.hidden = password.disabled;
    label.querySelector("span").textContent = mode === "signup" ? "Yeni şifre" : "Şifre";
    submit.textContent = {login: "Giriş yap", signup: "Hesap oluştur", reset: "Şifre sıfırlama bağlantısı gönder"}[mode];
    back.hidden = mode === "login";
    signup.hidden = reset.hidden = mode !== "login";
    message.textContent = "";
  }
  signup.onclick = () => showMode("signup");
  reset.onclick = () => showMode("reset");
  back.onclick = () => showMode("login");

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
      form.reset();
      showMode("login");
      showPasswordForm(false);
      document.getElementById("guestAccount").hidden = Boolean(owner);
      document.getElementById("memberActions").hidden = !owner;
      document.getElementById("accountTitle").textContent = owner ? "Hesabım · " + session.user.email : "Giriş yap ve alış fiyatlarını hatırla";
      priceMessage.textContent = "";
      retry.hidden = true;
      // Start database calls after the auth callback releases its session lock.
      if (owner) setTimeout(load, 0);
    }
    if (event === "PASSWORD_RECOVERY" && owner) showPasswordForm(true);
    if (event === "INITIAL_SESSION" && expiredLink && !owner) {
      panel.open = true;
      showMode("reset");
      message.textContent = "Bağlantının süresi dolmuş veya bağlantı daha önce kullanılmış. Şifre belirlemek için yeni bir bağlantı isteyin.";
    }
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const action = mode;
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    submit.disabled = signup.disabled = reset.disabled = back.disabled = true;
    message.textContent = "";
    try {
      if (action === "login") {
        const {error} = await client.auth.signInWithPassword({email, password});
        if (error) throw error;
      } else if (action === "signup") {
        const {data, error} = await client.auth.signUp({email, password, options: {emailRedirectTo: redirectTo}});
        if (error) throw error;
        if (!data.session && !owner) {
          showMode("login");
          message.textContent = "İlk giriş için e-posta adresinizi doğrulayın. Daha önce hesap açtıysanız şifrenizle giriş yapabilirsiniz.";
        }
      } else {
        const {error} = await client.auth.resetPasswordForEmail(email, {redirectTo});
        if (error) throw error;
        showMode("login");
        message.textContent = "Bu adresle bir hesabınız varsa şifre belirleme bağlantısı e-postanıza gönderildi.";
      }
    } catch (error) {
      message.textContent = authError(error, action);
    } finally { submit.disabled = signup.disabled = reset.disabled = back.disabled = false; }
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

function authError(error, action) {
  if (error.status === 429) return "Çok sık deneme yapıldı. Biraz sonra tekrar deneyin.";
  switch (error.code) {
    case "invalid_credentials": return "E-posta adresi veya şifre hatalı. İlk şifrenizi almak için “Şifremi unuttum”u seçebilirsiniz.";
    case "email_not_confirmed": return "Giriş için önce kayıt e-postasındaki bağlantıdan adresinizi doğrulayın.";
    case "weak_password": return "Bu şifre kabul edilmedi. Daha uzun, tahmin edilmesi zor bir şifre deneyin.";
    case "same_password": return "Yeni şifreniz önceki şifrenizden farklı olmalı.";
    case "reauthentication_needed": return "Şifreyi yenilemek için çıkış yapıp “Şifremi unuttum”u seçin.";
  }
  return {login: "Giriş yapılamadı.", signup: "Hesap oluşturulamadı.", reset: "Şifre sıfırlama e-postası gönderilemedi.",
    update: "Şifre kaydedilemedi."}[action] + " Lütfen tekrar deneyin.";
}
