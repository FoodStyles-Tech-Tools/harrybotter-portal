#!/usr/bin/env pwsh
# Script to remove all framer-motion imports and replace motion components with regular HTML elements

$files = @(
    "components\Toast.tsx",
    "components\TicketList.tsx",
    "components\TicketForm.tsx",
    "components\TicketDrawer.tsx",
    "components\SearchableDropdown.tsx"
)

foreach ($file in $files) {
    $path = "e:\Foodstyles\Techtool\Apps\harrybotter-portal\$file"
    if (Test-Path $path) {
        Write-Host "Processing $file..."
        $content = Get-Content $path -Raw
        
        # Remove framer-motion import
        $content = $content -replace "import \{ motion, AnimatePresence \} from 'framer-motion';\r?\n", ""
        $content = $content -replace "import \{ motion \} from 'framer-motion';\r?\n", ""
        $content = $content -replace "import \{ AnimatePresence \} from 'framer-motion';\r?\n", ""
        
        # Replace motion components with regular HTML
        $content = $content -replace "<motion\.div", "<div"
        $content = $content -replace "</motion\.div>", "</div>"
        $content = $content -replace "<motion\.tr", "<tr"
        $content = $content -replace "</motion\.tr>", "</tr>"
        
        # Remove AnimatePresence wrapper (keep children)
        $content = $content -replace "<AnimatePresence>\r?\n", ""
        $content = $content -replace "</AnimatePresence>", ""
        
        # Remove animation props from div/tr tags
        $content = $content -replace '\s+initial=\{[^}]+\}', ''
        $content = $content -replace '\s+animate=\{[^}]+\}', ''
        $content = $content -replace '\s+exit=\{[^}]+\}', ''
        $content = $content -replace '\s+transition=\{[^}]+\}', ''
        
        Set-Content $path -Value $content -NoNewline
        Write-Host "✓ Processed $file"
    }
}

Write-Host "`nDone! All framer-motion references removed."
