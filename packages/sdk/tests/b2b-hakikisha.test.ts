import { describe, it, expect, afterEach, vi } from "vitest";
import { Daraja } from "../src/index";
import { DarajaError } from "../src/types/errors";
import type { B2BHakikishaRequest } from "../src/types/b2b-hakikisha";

const VALID_KEY = "eiHPbfE2kZRwoEeOpJieKD68Hb7LZipRK9bOhUJvVVE5O2dO";
const VALID_SECRET =
  "tj3hH2PDZSw2GtrDUSl8FJFeGF42Yw5ZfmjfYRMp8A1CUY4loAOFtnGgOHwbh4px";

const VALID_REQUEST: B2BHakikishaRequest = {
  identifierType: "4",
  identifier: "666677",
};

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response;
}

async function expectDarajaError(
  fn: () => unknown,
  errorCode: string,
  messageContains?: string,
) {
  try {
    await fn();
    throw new Error("Expected function to throw, but it did not.");
  } catch (err) {
    expect(err).toBeInstanceOf(DarajaError);
    expect((err as DarajaError).errorCode).toBe(errorCode);
    if (messageContains) {
      expect((err as DarajaError).message).toContain(messageContains);
    }
  }
}

function makeClient(fetchImpl: typeof fetch) {
  global.fetch = fetchImpl as typeof fetch;
  return new Daraja({ consumerKey: VALID_KEY, consumerSecret: VALID_SECRET });
}

describe("B2BHakikishaClient — query", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts a fully valid request and sends the correct wire body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          ConversationID: "410c-48e1-b4ab-57d897c8c7a0141968",
          ResponseCode: "0",
          ResponseMessage: "Success",
          DetailedMessage: "Request received successfully",
          OrganizationShortCode: "666677",
          OrganizationName: "Daraja",
          ChargeProfileID: "20013",
        }),
      );
    const daraja = makeClient(fetchMock);

    const result = await daraja.b2bHakikisha.query(VALID_REQUEST);

    expect(result.OrganizationName).toBe("Daraja");

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody).toEqual({ IdentifierType: "4", Identifier: "666677" });
  });

  it('accepts identifierType "2" (Till number)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          ConversationID: "x",
          ResponseCode: "0",
          ResponseMessage: "Success",
          DetailedMessage: "ok",
          OrganizationShortCode: "600984",
          OrganizationName: "Test Store",
          ChargeProfileID: "20129",
        }),
      );
    const daraja = makeClient(fetchMock);

    await expect(
      daraja.b2bHakikisha.query({ identifierType: "2", identifier: "600984" }),
    ).resolves.toBeDefined();
  });

  it("trims whitespace from identifier", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          ConversationID: "x",
          ResponseCode: "0",
          ResponseMessage: "Success",
          DetailedMessage: "ok",
          OrganizationShortCode: "666677",
          OrganizationName: "Daraja",
          ChargeProfileID: "20013",
        }),
      );
    const daraja = makeClient(fetchMock);

    await daraja.b2bHakikisha.query({
      identifierType: "4",
      identifier: "  666677  ",
    });

    const sentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sentBody.Identifier).toBe("666677");
  });

  it("rejects an unrecognized identifierType", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.b2bHakikisha.query({
          ...VALID_REQUEST,
          identifierType: "9" as never,
        }),
      "INVALID_B2B_HAKIKISHA_REQUEST",
      "identifierType",
    );
  });

  it.each([
    ["non-numeric", "ABCDEF"],
    ["empty string", ""],
  ])("rejects an invalid identifier: %s", async (_label, badIdentifier) => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () =>
        daraja.b2bHakikisha.query({
          ...VALID_REQUEST,
          identifier: badIdentifier,
        }),
      "INVALID_B2B_HAKIKISHA_REQUEST",
      "identifier",
    );
  });

  it("rejects a non-object request (e.g. null)", async () => {
    const daraja = makeClient(vi.fn());
    await expectDarajaError(
      () => daraja.b2bHakikisha.query(null as unknown as B2BHakikishaRequest),
      "INVALID_B2B_HAKIKISHA_REQUEST",
    );
  });

  it("propagates an upstream API error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: "tok", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(500, {
          errorCode: "500",
          errorMessage: "Invalid parameter input",
        }),
      );
    const daraja = makeClient(fetchMock);

    await expectDarajaError(
      () => daraja.b2bHakikisha.query(VALID_REQUEST),
      "500",
      "Invalid parameter input",
    );
  });
});
