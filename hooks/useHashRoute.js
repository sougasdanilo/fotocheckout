import { useEffect, useState } from "react";

const VALID_ROUTES = new Set(["/captura", "/registros"]);

function normalizeRoute(hashRoute, defaultRoute) {
  const cleanRoute = hashRoute.replace(/^#/, "") || defaultRoute;
  return VALID_ROUTES.has(cleanRoute) ? cleanRoute : defaultRoute;
}

export function useHashRoute(defaultRoute = "/captura") {
  const [route, setRoute] = useState(() =>
    typeof window === "undefined"
      ? defaultRoute
      : normalizeRoute(window.location.hash, defaultRoute),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (!window.location.hash) {
      window.history.replaceState(null, "", `#${defaultRoute}`);
      setRoute(defaultRoute);
    }

    function handleHashChange() {
      setRoute(normalizeRoute(window.location.hash, defaultRoute));
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [defaultRoute]);

  function navigate(nextRoute) {
    if (typeof window === "undefined") {
      return;
    }

    const normalizedRoute = normalizeRoute(nextRoute, defaultRoute);
    if (normalizedRoute === route) {
      return;
    }

    window.location.hash = normalizedRoute;
  }

  return {
    route,
    navigate,
  };
}
