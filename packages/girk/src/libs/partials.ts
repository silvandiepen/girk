import { Payload } from "../types";

// Partials are not processed yet; kept as a pipeline step so the build order stays stable.
export const processPartials = async (payload: Payload): Promise<Payload> => payload;
