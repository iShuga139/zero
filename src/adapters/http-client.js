import axios from "axios";

const getURL = (serviceName, uri) => `http://${serviceName}:8080${uri}`;
const getHeaders = (authToken, moreHeaders) =>
  Object.assign(
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`
    },
    moreHeaders
  );

const makeRequest = (method, url, headers, params, data) => axios({ method, url, headers, params, data });

export default {
  do: (method, uri, { headers, params, body, service, authToken, isInternal = true }) => {
    const url = isInternal ? getURL(service, uri) : uri;
    const allHeaders = isInternal ? getHeaders(authToken, headers) : headers;

    console.log(method, url, allHeaders, params, body);
    return makeRequest(method, url, allHeaders, params, body);
  }
};
