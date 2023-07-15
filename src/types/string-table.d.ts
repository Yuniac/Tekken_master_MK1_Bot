declare module "string-table" {
  function create(
    data: Record<string, string | number>[],
    options?: {
      /** An array of strings indicating which column headers to include (and in what order) */
      headers?: string[];
      /** Whether or not to capitalize the table's column headers */
      capitalizeHeaders?: boolean;
      /** An object mapping column names to formatter functions, which will accept (value, header) arguments */
      formatters?: Record<
        string,
        (
          value: string | number,
          header?: string
        ) =>
          | string
          | {
              value: string;
              format?: {
                color?: string;
                alignment?: "right" | "left";
              };
            }
      >;
      typeFormatters?: any;
      /** The character(s) used to enclose the table and to delimit cells within the table, respectively */
      outerBorder?: string;
      /** The character(s) used to enclose the table and to delimit cells within the table, respectively */
      innerBorder?: string;
      /** The character used to separate rows in the table */
      rowSeparator?: string;
      /** The character used to separate the header row from the table body */
      headerSeparator?: string;
    }
  ): string {}
}
