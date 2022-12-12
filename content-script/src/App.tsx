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
      height={300}
    >
      <Box textAlign="center">
        <Typography variant="h2" marginBottom={5}>
          Loading Video Slicer
        </Typography>
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
