# India location data

The app stores state, district, block/tehsil, and village rows in MongoDB. This keeps the long village lists out of the browser bundle and lets the client request each level only after its parent has been selected.

For a local sample, run from `Server/`:

```sh
npm run locations:seed
```

This seeds sample locations in Uttar Pradesh and Punjab. The examples are for UI development and are not a complete LGD directory.

## Importing the full LGD export

1. Download the current state/district/sub-district/block/village directory export from the [Local Government Directory](https://lgdirectory.gov.in/) in CSV format. Keep the official LGD codes in the export.
2. Ensure the CSV has columns for state, district, block (or sub-district/tehsil), and village. Code columns are optional and may be named `state_code`, `district_code`, `block_code`/`subdistrict_code`, and `village_code`.
3. Configure the MongoDB connection in `Server/.env`, then run:

   ```sh
   npm run locations:import -- path/to/lgd-locations.csv
   ```

The importer maps each row into parent-linked records and upserts by level, parent ID, and name, so it can be rerun when LGD updates the directory. Import a complete hierarchy export; incomplete rows are skipped.
