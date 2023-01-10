import {
  Box,
  CircularProgress,
  createTheme,
  CssBaseline,
  Grid,
  ThemeProvider,
  Typography,
} from "@suid/material";
import { Suspense } from "solid-js";
import YoutubeSlicer from "./YoutubeSlicer";

const App = () => {
  const loadingSpinner = (
    <Grid
      container
      alignItems={"center"}
      justifyContent="center"
      justifyItems={"center"}
      height={100}
    >
      <Box textAlign="center">
        <CircularProgress />
      </Box>
    </Grid>
  );

  const theme = createTheme({
    palette: {
      mode: "dark",
    },
    components: {
      MuiTableCell: {
        defaultProps: {
          padding: "none",
          sx: { fontSize: 15 },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Suspense fallback={loadingSpinner}>
        <YoutubeSlicer />
      </Suspense>
    </ThemeProvider>
  );
};

export default App;
