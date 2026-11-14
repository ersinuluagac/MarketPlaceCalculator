import { getAccountClient, authError } from "./auth-client.js";

const get = id => document.getElementById(id);
const form = get("authForm");
const fields = get("authFields");
const email = get("email"), password = get("password");
const message = get("authMessage");
const params = new URLSearchParams(location.search);
const register = document.documentElement.dataset.page === "kayit";
const reset = !register && ["sifirla", "baglanti"].includes(params.get("islem"));
const hasReportTab = params.get("rapor") === "acik";
const action = register ? "signup" : reset ? "reset" : "login";
const redirectTo = location.origin + "/satislar";
const alternate = get("alternate");
const continueLink = get("continueReport");
const resend = get("resendConfirm");
let client;
let confirmationAddress = "";

if (reset) {
  get("authTitle").textContent = "Şifrenizi sıfırlayın";
  document.title = "Şifre sıfırlama · KazancınıBil";
  get("authIntro").textContent = "Hesabınızın e-posta adresine bir şifre belirleme bağlantısı gönderelim.";
  get("passwordField").hidden = password.disabled = true;
  get("authSubmit").firstChild.textContent = "Bağlantı gönder";
  alternate.firstChild.textContent = "";
  const link = alternate.querySelector("a");
  link.href = "/giris";
  link.textContent = "Girişe dön";
  if (params.get("islem") === "baglanti") message.textContent = "Bağlantı geçersiz veya süresi dolmuş. Yeni bir bağlantı isteyebilirsiniz.";
}
if (hasReportTab) {
  const links = document.querySelectorAll("[data-account-route], #forgotPassword");
  for (const link of links) {
    const url = new URL(link.href);
    url.searchParams.set("rapor", "acik");
    link.href = url.href;
  }
}
get("revealPassword").addEventListener("click", event => {
  const button = event.currentTarget;
  const visible = password.type === "password";
  password.type = visible ? "text" : "password";
  button.textContent = visible ? "Gizle" : "Göster";
  button.setAttribute("aria-pressed", String(visible));
});

function signedIn() {
  if (!hasReportTab) {
    location.replace("/satislar");
    return;
  }
  form.reset();
  form.hidden = alternate.hidden = resend.hidden = true;
  get("authTitle").textContent = "Giriş yapıldı";
  get("authIntro").textContent = "Yüklediğiniz rapor önceki sekmede açık. Kayıtlı fiyatlarınız rapora uygulanır.";
  message.textContent = "";
  continueLink.hidden = false;
  continueLink.textContent = "Rapora dön";
  continueLink.onclick = event => {
    if (continueLink.dataset.fallback) return;
    event.preventDefault();
    window.close();
    message.textContent = "Devam etmek için açık rapor sekmenize geçin.";
    continueLink.dataset.fallback = "true";
    continueLink.textContent = "Bu sekmede satış raporunu aç";
  };
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (fields.disabled || !client) return;
  fields.disabled = true;
  resend.hidden = true;
  message.textContent = "";
  const address = email.value.trim();
  try {
    if (register) {
      const {data, error} = await client.auth.signUp({email: address, password: password.value, options: {emailRedirectTo: redirectTo}});
      if (error) throw error;
      if (data.session) return signedIn();
      form.reset();
      form.hidden = true;
      get("authTitle").textContent = "E-postanızı kontrol edin";
      get("authIntro").textContent = address + " adresine gelen doğrulama bağlantısını açarak kaydınızı tamamlayın.";
      confirmationAddress = address;
      resend.hidden = false;
    } else if (reset) {
      const {error} = await client.auth.resetPasswordForEmail(address, {redirectTo});
      if (error) throw error;
      form.hidden = true;
      get("authTitle").textContent = "E-postanızı kontrol edin";
      get("authIntro").textContent = "Bu adrese bağlı bir hesap varsa şifre belirleme bağlantısı gönderildi.";
    } else {
      const {error} = await client.auth.signInWithPassword({email: address, password: password.value});
      if (error) throw error;
      signedIn();
    }
  } catch (error) {
    message.textContent = authError(error, action);
    if (error.code === "email_not_confirmed") {
      confirmationAddress = address;
      resend.hidden = false;
    }
  } finally { fields.disabled = false; }
});

resend.addEventListener("click", async () => {
  if (!confirmationAddress || resend.disabled) return;
  resend.disabled = true;
  try {
    const {error} = await client.auth.resend({type: "signup", email: confirmationAddress, options: {emailRedirectTo: redirectTo}});
    if (error) throw error;
    message.textContent = "Yeni bağlantı istendi. Gelen kutunuzu ve gereksiz posta klasörünü kontrol edin.";
  } catch (error) {
    message.textContent = authError(error, "resend");
  } finally { resend.disabled = false; }
});

try {
  client = await getAccountClient();
  const {data, error} = await client.auth.getSession();
  if (error) throw error;
  if (data.session && !reset) signedIn();
  else fields.disabled = false;
} catch {
  message.textContent = "Üyelik hizmetine ulaşılamadı. Bağlantınızı kontrol edip sayfayı yenileyin.";
}
