import Sequelize, { DataTypeAbstract, DefineAttributeColumnOptions } from 'sequelize';
import { WalletInfo } from './Types';

// TODO: don't have currency in OutputFactory and UtxoFactory
export type SequelizeAttributes<T extends { [key: string]: any }> = {
  [P in keyof T]: string | DataTypeAbstract | DefineAttributeColumnOptions
};

/*
 * The following definitions are in sets of triplets, one for each Model (which represents a table in the database).
 *
 * "xFactory" is the type definition for the object which is required when a new record is to be created.
 *
 * "xAttributes" is the type definition of the record. It cannot support nullables, as it is being used for the table's columns definition.
 *
 * "xInstance" is the type definition of a fetched record as a Sequelize row instance, which contains some util properties.
 */

export type WalletFactory = WalletInfo & {
  symbol: string;
};

export type WalletAttributes = WalletFactory;

export type WalletInstance = WalletAttributes & Sequelize.Instance<WalletAttributes>;

export type OutputFactory = {
  script: string;
  redeemScript?: string;
  currency: string;
  keyIndex: number;
  type: number;
};

export type OutputAttributes = OutputFactory & {
  id: number;
};

export type OutputInstance = OutputAttributes & Sequelize.Instance<OutputAttributes>;

export type UtxoFactory = {
  outputId: number;
  txHash: string;
  vout: number;
  currency: string,
  value: number;
  confirmed: boolean;
  spent: boolean;
};

export type UtxoAttributes = UtxoFactory & {
  id: number;
};

export type UtxoInstance = UtxoAttributes & Sequelize.Instance<UtxoAttributes>;
