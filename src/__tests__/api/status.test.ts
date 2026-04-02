import { PresenceChecker } from "../../presence.js";
import StatusEndpoint from "../../api/status.js";

beforeEach(() => {
  (PresenceChecker as unknown as { instance: unknown }).instance = undefined;
});

describe("StatusEndpoint", () => {
  function makeChecker(online: boolean) {
    return { isOnline: jest.fn().mockReturnValue(online) } as unknown as jest.Mocked<PresenceChecker>;
  }

  it("returns online=true for an online user", () => {
    jest.spyOn(PresenceChecker, "getInstance").mockReturnValue(makeChecker(true));
    const result = new StatusEndpoint().get({ endpointParams: { snowflake: "123" }, urlParams: {} });
    expect(result).toEqual({ snowflake: "123", online: true });
  });

  it("returns online=false for an offline user", () => {
    jest.spyOn(PresenceChecker, "getInstance").mockReturnValue(makeChecker(false));
    const result = new StatusEndpoint().get({ endpointParams: { snowflake: "123" }, urlParams: {} });
    expect(result).toEqual({ snowflake: "123", online: false });
  });

  it("passes the correct snowflake to PresenceChecker", () => {
    const checker = makeChecker(true);
    jest.spyOn(PresenceChecker, "getInstance").mockReturnValue(checker);
    new StatusEndpoint().get({ endpointParams: { snowflake: "987654321" }, urlParams: {} });
    expect(checker.isOnline).toHaveBeenCalledWith("987654321");
  });

  it("declares snowflake as a GET-required endpoint parameter", () => {
    const ep = new StatusEndpoint();
    expect(ep.endpointParameters).toContainEqual(
      expect.objectContaining({ name: "snowflake", requiredBy: expect.arrayContaining(["GET"]) }),
    );
  });

  it("is PUBLIC auth", () => {
    expect(new StatusEndpoint().auth).toBe("PUBLIC");
  });
});
