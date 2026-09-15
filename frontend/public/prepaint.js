try {
  const unlocked = sessionStorage.getItem("healthflow-access-code")
    && sessionStorage.getItem("healthflow-clinic-id")
    && sessionStorage.getItem("healthflow-user-id");
  if (unlocked) {
    document.getElementById("access-gate-prepaint").hidden = true;
    document.getElementById("root").removeAttribute("aria-hidden");
  }
} catch {}
