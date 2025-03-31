# Math Trainer Web Application

This is a simple web-based Math Training Game designed to help users practice basic arithmetic operations.

You can try the game here: https://d57udy.github.io/Math-trainer/

## Features

Based on the [Requirements Document](Requirements.md), this application currently implements:

*   **Equation Generation (Integers Only):**
    *   Generates equations (`a op b = ?`) using Addition (+), Subtraction (-), Multiplication (*), and Division (/).
    *   Configurable number range (min/max) for operands and results.
    *   Option to allow/disallow negative numbers.
    *   Ensures division problems result in integers.
*   **User Interaction & Feedback:**
    *   Displays equations clearly.
    *   Accepts numerical user input.
    *   Provides immediate feedback (Correct/Incorrect) and shows the correct answer if wrong.
*   **Progress Tracking & Statistics:**
    *   Tracks the number of times each unique equation is answered correctly.
    *   Tracks the fastest time taken to solve each equation correctly.
    *   All progress data is saved locally in the browser's `localStorage`.
*   **Award System:**
    *   Assigns award levels (Silver 🥈, Gold 🥇, Diamond 💎) to equations based on the number of correct solves.
    *   Displays the current award level next to the equation during gameplay.
*   **Training Mode ("Equations to Train"):**
    *   Incorrectly answered equations are added to a persistent "Equations to Train" list.
    *   Users can view this list.
    *   Users can start a "Training Mode" session that cycles through only the equations on the list.
    *   Equations are removed from the list when answered correctly in Training Mode.
*   **Regular Game Mode (Timed Challenge):**
    *   Users can start a timed session (duration configurable in settings).
    *   Presents a continuous stream of random equations based on current settings.
    *   Displays a timer and score.
    *   Score increases for each correct answer.
    *   Shows a summary screen with the final score when the timer ends.
*   **Settings Menu:**
    *   Allows users to select active arithmetic operations.
    *   Allows users to set the number range (min/max).
    *   Allows users to toggle negative number support.
    *   Allows users to set the timer duration for Regular Game Mode.
    *   All settings are saved locally in the browser's `localStorage`.

## How to Run Locally

1.  Clone or download this repository to your local machine.
2.  Navigate to the project directory.
3.  Open the `index.html` file in your web browser.

That's it! The application runs entirely in the browser using HTML, CSS, and JavaScript.

## How to Deploy to GitHub Pages

1.  Ensure your project code is pushed to a GitHub repository.
2.  In your GitHub repository, go to `Settings` > `Pages`.
3.  Under the "Build and deployment" section, select `Deploy from a branch` as the Source.
4.  Choose the branch containing your code (usually `main` or `master`).
5.  Select the `/ (root)` directory.
6.  Click `Save`.
7.  GitHub will build and deploy your page. It might take a few minutes. The URL for your live page will be displayed in the Pages settings.

## Future Enhancements / Not Yet Implemented

*   Support for **Fractions** (FR1.5).
*   Support for **Real/Decimal Numbers** (FR1.6).
*   More robust input validation/parsing for different number types.
*   User Profiles.
*   Visual themes, sound effects.
*   Adaptive difficulty.
*   Detailed statistics/graphs. 