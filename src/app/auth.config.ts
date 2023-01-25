import { isPlatform } from "@ionic/angular";
import config from "../../capacitor.config";

export const domain = "pillpocket.eu.auth0.com";
export const clientId = "M1wPU2yK5iQhw4dydiY7Vh3YAPPNjse0";
const { appId } = config;

// Use `auth0Domain` in string interpolation below so that it doesn't
// get replaced by the quickstart auto-packager
const auth0Domain = domain;
const iosOrAndroid = isPlatform("ios") || isPlatform("android");

export const callbackUri = iosOrAndroid
  ? `${appId}://${auth0Domain}/capacitor/${appId}/callback`
  : "http://localhost:8100/callback";

export const returnTo = iosOrAndroid
  ? `${appId}://${auth0Domain}/capacitor/${appId}/logout`
  : "http://localhost:8100/logout";