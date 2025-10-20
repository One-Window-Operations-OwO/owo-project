import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { NextResponse } from "next/server";

interface UnifiedRequestBody {
  sheetId: string;
  rowIndex: number;
  action: "update" | "formatSkip" | "formatSkipHitam";
  updates?: Record<string, string | number>;
  customReason?: string;
}

export async function POST(req: Request) {
  const session: Session | null = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    sheetId,
    rowIndex,
    updates,
    action,
    customReason,
  }: UnifiedRequestBody = await req.json();

  if (!sheetId || !rowIndex || !action) {
    return NextResponse.json(
      { error: "Parameter tidak lengkap (sheetId, rowIndex, action)" },
      { status: 400 }
    );
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const sheets = google.sheets({ version: "v4", auth });

    if (action === "update") {
      if (!updates) {
        return NextResponse.json(
          { error: "Parameter 'updates' dibutuhkan untuk action 'update'" },
          { status: 400 }
        );
      }
      const data = Object.entries(updates).map(([column, value]) => ({
        range: `'Lembar Kerja'!${column}${rowIndex}`,
        values: [[value]],
      }));
      if (updates && updates.N === "Sesuai") {
      data.push({
          range: `'Lembar Kerja'!I${rowIndex}`, 
          values: [[`=H${rowIndex}`]], 
        });
      }
      // jika ada customReason, masukkan ke kolom W
      if (customReason) {
        data.push(
          {
            range: `'Lembar Kerja'!Y${rowIndex}`,
            values: [[customReason]],
          },
          {
            range: `'Lembar Kerja'!X${rowIndex}`,
            values: [["DITOLAK"]],
          }
        );
      }

      const response = await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: { valueInputOption: "USER_ENTERED", data: data },
      });

      return NextResponse.json({ success: true, data: response.data });
    } else {
      const requests = [
        {
          repeatCell: {
            range: {
              sheetId: 340924294,
              startRowIndex: rowIndex - 1,
              endRowIndex: rowIndex,
              startColumnIndex: 9,
              endColumnIndex: 24,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor:
                  action === "formatSkip"
                    ? { red: 1, green: 1, blue: 1 }
                    : { red: 0.85, green: 0.85, blue: 0.85 },
              },
            },
            fields: "userEnteredFormat.backgroundColor",
          },
        },
        {
          updateCells: {
            range: {
              sheetId: 340924294,
              startRowIndex: rowIndex - 1,
              endRowIndex: rowIndex,
              startColumnIndex: 23,
              endColumnIndex: 24,
            },
            rows: [
              {
                values: [
                  {
                    userEnteredValue: {
                      stringValue: action === "formatSkip" ? null : "HITAM",
                    },
                  },
                ],
              },
            ],
            fields: "userEnteredValue",
          },
        },
      ];
      const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: { requests: requests },
      });
      return NextResponse.json({
        success: true,
        message: "Pewarnaan dan update skip berhasil",
        data: response.data,
      });
    }
  } catch (error: unknown) {
    let errorMessage = "Terjadi kesalahan saat mengupdate Google Sheets.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Google Sheets API Batch Update Error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate Google Sheets.", details: errorMessage },
      { status: 500 }
    );
  }
  // Tambahan: handle jika action tidak valid
  return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
}
