import axios from 'axios';
import csv from 'csv-parse';
import { Address4, Address6 } from 'ip-address';
import Logger from '../Logger';

type Country = {
  start: bigint;
  end: bigint;
  country: string;
};

type MarkingsConfig = {
  ipV4Ranges: string;
  ipV6Ranges: string;

  countries?: string[];
};

class CountryCodes {
  private ranges: Country[] = [];

  constructor(
    private readonly logger: Logger,
    private readonly config: MarkingsConfig,
  ) {
    if (this.config.countries && this.config.countries.length > 0) {
      this.logger.verbose(
        `Marking swaps from countries: ${this.config.countries}`,
      );
    }
  }

  public downloadRanges = async () => {
    if (
      this.config.countries === undefined ||
      this.config.countries.length === 0
    ) {
      this.logger.verbose(
        'Not updating country IP ranges because not relevant countries were set',
      );
      return;
    }

    this.ranges = (
      await Promise.all(
        (
          await Promise.all(
            [this.config.ipV4Ranges, this.config.ipV6Ranges].map((url) =>
              axios.get<string>(url),
            ),
          )
        ).map((res) => CountryCodes.parseDatabase(res.data)),
      )
    ).flat();
    this.logger.verbose('Updated country IP ranges database');
  };

  public isRelevantCountry = (country?: string) =>
    country !== undefined &&
    this.config.countries !== undefined &&
    this.config.countries.includes(country);

  public getCountryCode = (
    ip: string,
    isIpV6?: boolean,
  ): string | undefined => {
    const addr = CountryCodes.tryGetAddress(ip, isIpV6);
    if (addr === undefined) {
      return;
    }

    return this.ranges.find(
      (country) => addr >= country.start && addr <= country.end,
    )?.country;
  };

  private static parseDatabase = async (data: string): Promise<Country[]> => {
    const parsed = await new Promise<[string, string, string][]>(
      (resolve, reject) => {
        csv.parse(
          data,
          {
            delimiter: ',',
          },
          (error, data) => {
            if (error !== undefined) {
              reject(error);
            }

            resolve(data);
          },
        );
      },
    );

    return parsed.map((row) => ({
      start: BigInt(row[0]),
      end: BigInt(row[1]),
      country: row[2],
    }));
  };

  private static getAddress = (address: string, isIpV6: boolean): bigint => {
    if (isIpV6) {
      return new Address6(address).bigInt();
    } else {
      return BigInt(new Address4(address).bigInt().toString());
    }
  };

  private static tryGetAddress = (
    address: string,
    isIpV6?: boolean,
  ): bigint | undefined => {
    if (isIpV6 !== undefined) {
      return CountryCodes.getAddress(address, isIpV6);
    }

    for (const isV6 of [false, true]) {
      try {
        return CountryCodes.getAddress(address, isV6);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        /* empty */
      }
    }

    return undefined;
  };
}

export default CountryCodes;
export { MarkingsConfig };
