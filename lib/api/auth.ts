export function getAuthToken() {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("clientAuthToken="))
      ?.split("=")[1];
  }
  