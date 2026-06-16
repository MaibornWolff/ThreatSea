import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import type { Asset } from "#api/types/asset.types.ts";

interface AddThreatAssetsTabProps {
    active: boolean;
    assets: Asset[];
}

export const AddThreatAssetsTab = ({ active, assets }: AddThreatAssetsTabProps) => {
    return (
        <Box
            sx={{
                display: active ? "flex" : "none",
                flexDirection: "row",
                width: "100%",
            }}
        >
            <TableContainer
                sx={{
                    height: "100%",
                    overflowY: "auto",
                    boxSizing: "border-box",
                    position: "relative",
                    width: "100%",
                    "::-webkit-scrollbar-track": {
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 500,
                        borderTopRightRadius: 500,
                    },
                }}
            >
                <Table stickyHeader sx={{ minWidth: 300 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    py: 0,
                                    bgcolor: "background.mainIntransparent",
                                    width: "10%",
                                }}
                            >
                                ID
                            </TableCell>
                            <TableCell
                                sx={{
                                    py: 0,
                                    bgcolor: "background.mainIntransparent",
                                    width: "70%",
                                }}
                            >
                                Name
                            </TableCell>
                            <TableCell
                                sx={{
                                    py: 0,
                                    borderBottom: "1px solid",
                                    bgcolor: "background.mainIntransparent",
                                }}
                            >
                                C
                            </TableCell>
                            <TableCell
                                sx={{
                                    py: 0,
                                    borderBottom: "1px solid",
                                    bgcolor: "background.mainIntransparent",
                                }}
                            >
                                I
                            </TableCell>
                            <TableCell
                                sx={{
                                    py: 0,
                                    borderBottom: "1px solid",
                                    bgcolor: "background.mainIntransparent",
                                }}
                            >
                                A
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assets.map((asset) => (
                            <TableRow key={asset.id}>
                                <TableCell
                                    sx={{
                                        fontSize: "1rem",
                                        py: "13px",
                                    }}
                                >
                                    {asset.id}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontSize: "1rem",
                                        py: "13px",
                                    }}
                                >
                                    {asset.name}
                                </TableCell>
                                <TableCell sx={{ py: "13px" }}>{asset.confidentiality}</TableCell>
                                <TableCell sx={{ py: "13px" }}>{asset.integrity}</TableCell>
                                <TableCell sx={{ py: "13px" }}>{asset.availability}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
