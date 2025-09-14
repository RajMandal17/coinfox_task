#!/bin/bash

echo "🚀 Coinfox GitHub Repository Setup"
echo "=================================="
echo ""
echo "This script will help you push your Coinfox project to GitHub."
echo ""
echo "📋 Prerequisites:"
echo "1. You need a GitHub account"
echo "2. Create a new repository at: https://github.com/new"
echo "   - Repository name: coinfox-portfolio-tracker"
echo "   - Description: 🚨 Cryptocurrency Portfolio Tracker with Real-time Price Alerts"
echo "   - Set to Public or Private as you prefer"
echo "   - DO NOT initialize with README, .gitignore, or license"
echo ""
echo "💡 After creating the repository, GitHub will show you the repository URL."
echo "    It will look like: https://github.com/YOUR_USERNAME/coinfox-portfolio-tracker.git"
echo ""

read -p "📝 Enter your GitHub repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Repository URL is required!"
    exit 1
fi

echo ""
echo "🔗 Setting up remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Your Coinfox project is now available at:"
    echo "   Repository: $REPO_URL"
    echo "   Live Demo: You can set up GitHub Pages in repository Settings > Pages"
    echo ""
    echo "📊 Project Statistics:"
    echo "   - Files: $(git ls-files | wc -l | tr -d ' ') tracked files"
    echo "   - Components: $(find src/Components -name "*.js" | wc -l | tr -d ' ') React components"
    echo "   - Features: Complete price alert system with real-time monitoring"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Set up GitHub Pages for live demo"
    echo "2. Add collaborators if needed"
    echo "3. Set up issue templates"
    echo "4. Configure branch protection rules"
    echo ""
    echo "📖 Documentation:"
    echo "   - Full README with setup instructions included"
    echo "   - Interactive guide at /price-alert-guide.html"
    echo "   - Debug functions available in browser console"
else
    echo ""
    echo "❌ Failed to push to GitHub!"
    echo ""
    echo "🔍 Common issues and solutions:"
    echo "1. Authentication: Make sure you're logged into GitHub"
    echo "2. Repository URL: Verify the URL is correct"
    echo "3. Permissions: Ensure you have write access to the repository"
    echo ""
    echo "🆘 Troubleshooting:"
    echo "   - Try: git remote -v (to check remote URL)"
    echo "   - Try: git status (to check repository state)"
    echo "   - Try: git push origin main --force (if needed)"
fi
