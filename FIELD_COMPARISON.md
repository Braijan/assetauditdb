# Asset Fields Comparison: Airtable vs Our Database

## ✅ Fields in Airtable (ALL PRESENT)
1. **Asset Tag** → `identifiers` (CLIENT_TAG type)
2. **Serial Number** → `identifiers` (SERIAL type)
3. **Make** → `manufacturer`
4. **Model** → `model`
5. **Processor** → `processor`
6. **RAM Size (GB)** → `ramSizeGb`
7. **Storage Type** → `storageType`
8. **Storage Capacity (GB)** → `storageCapacityGb`
9. **Screen Size (inches)** → `screenSizeInches`
10. **Operating System** → `operatingSystem`
11. **R2v3 Compliance** → `r2v3Compliance`
12. **Asset Value (USD)** → `resaleValue`
13. **Purchase Date** → `purchaseDate`
14. **Location** → `currentLocation` (relation)
15. **Assigned To** → `assignedTo` (relation)
16. **Compliance Notes** → `complianceNotes`
17. **Hard Drives** → `hardDrives` (serial numbers)
18. **Asset Age (years)** → Calculated from `purchaseDate`
19. **Number of Hard Drives** → Calculated from `hardDrives.length`
20. **Total Hard Drive Capacity (GB)** → Calculated from `hardDrives`
21. **Total Hard Drive Value (USD)** → Calculated from `hardDrives`
22. **All Hard Drive Destruction Statuses** → From `hardDrives.destructionStatus`
23. **Destruction Certificates** → From `hardDrives.destructionCertificate`
24. **Hard Drive Wiped** → From `sanitizationResults`
25. **Wipe Certificate** → From `sanitizationResults.certificateNumber`
26. **Wiped Date** → From `sanitizationResults.verifiedAt`

## ⚠️ Fields We Have That Are NOT in Airtable

### Potentially Needed for R2v3 Compliance:
- `dataBearing` - Determines if hard drive wipe is required (R2v3 requirement)
- `hazmat` - Required for R2v3 compliance tracking

### Workflow/System Fields (Not in Export):
- `currentStatus` - Tracks asset workflow (RECEIVED, IN_PROCESS, SANITIZED, etc.)
- `clientId` - Required relationship (not exported but needed)

### Possibly Extraneous:
- `deviceType` - LAPTOP, DESKTOP, etc. (useful for filtering but not in Airtable)
- `formFactor` - Physical form factor (not in Airtable)
- `receivedDate` - When asset was received (not in Airtable)
- `grade` - A, B, C, D quality grade (not in Airtable)
- `weightKg` - Weight in kilograms (not in Airtable)
- `purchaseCost` - What we paid (not in Airtable, only resaleValue is)
- `notes` - General notes field (not in Airtable)

### AI Fields (To Discuss):
- `complianceSummary` - AI-generated summary
- `suggestedNextAction` - AI-generated next action

## 📸 Missing from Airtable (To Discuss):
- **Asset Images** - Photos of the asset (mentioned by user)

