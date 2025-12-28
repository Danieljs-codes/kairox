export function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function setCookie(
  name: string,
  value: string,
  options: { maxAge?: number; path?: string } = {}
) {
  if (typeof document === "undefined") return;

  let cookieString = `${name}=${value}`;
  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }
  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += "; path=/";
  }

  document.cookie = cookieString;
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;

  if ("cookieStore" in window) {
    window.cookieStore.delete(name);
  } else {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export const getFlashCookie = () => {
  const toastCookie = getCookie("toast");

  if (!toastCookie) {
    return null;
  }

  try {
    const toastContents = JSON.parse(decodeURIComponent(toastCookie)) as {
      type: "success" | "error" | "info" | "warning";
      title: string;
      description?: string;
    };

    deleteCookie("toast");

    return toastContents;
  } catch (e) {
    console.error("Failed to parse flash cookie", e);
    return null;
  }
};

export const setFlashCookie = (data: {
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
}) => {
  setCookie("toast", encodeURIComponent(JSON.stringify(data)), {
    maxAge: 60 * 5, // 5 minutes
    path: "/",
  });
};

export const getSidebarState = () => {
  const sidebarCookie = getCookie("sidebar_state") ?? "false";
  return decodeURIComponent(sidebarCookie) === "true";
};
