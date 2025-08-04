"use client"

import { useState } from "react"
import {
  Globe,
  Zap,
  BarChart3,
  Settings,
  Download,
  FileText,
  CheckCircle,
  TrendingUp,
  Shield,
  Search,
  AlertCircle,
  Clock,
  ExternalLink,
  Eye,
  Target,
  Layers,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface AnalysisResult {
  url: string
  timestamp: string
  status: string
  total_links?: number
  internal_links?: Array<{ url: string; text: string; title: string }>
  external_links?: Array<{ url: string; text: string; title: string }>
  cms_detected?: {
    primary_cms: string | null
    detected_systems: Record<string, any>
    total_detected: number
  }
  analytics_tools?: {
    detected_tools: Record<string, any>
    total_detected: number
  }
  elements?: {
    headings: any
    images: any
    forms: any
    links: any
    meta_tags: any
    accessibility: any
    performance?: any
    security?: any
  }
  analyzed_data?: Array<any>
  summary?: any
  quick_mode?: boolean
  base_url?: string
  total_internal_links?: number
  analyzed_links?: number
  failed_links?: number
  failed_data?: Array<any>
  page_insights?: {
    load_time: number
    page_size: number
    total_requests: number
    performance_score: number
  }
  // Form validation specific fields
  total_pages_crawled?: number
  forms_found?: number
  forms_with_multiple_inputs?: number
  detailed_forms?: Array<{
    page_url: string
    form_index: number
    input_count: number
    input_types: string[]
    form_method: string
    form_action: string
    form_classification: string
    has_labels: boolean
    accessibility_score: number
  }>
  form_types_breakdown?: Record<string, number>
  pages_with_forms?: string[]
  method?: string
  note?: string
}

export default function XerauditronTool() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingType, setLoadingType] = useState("")
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [progress, setProgress] = useState(0)

  const validateUrl = (inputUrl: string): string | null => {
    try {
      let processedUrl = inputUrl.trim()

      // Add protocol if missing
      if (!processedUrl.startsWith("http://") && !processedUrl.startsWith("https://")) {
        processedUrl = "https://" + processedUrl
      }

      // Validate URL format
      const urlObj = new URL(processedUrl)

      // Check for valid domain
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        return null
      }

      return processedUrl
    } catch {
      return null
    }
  }

  const handleAnalysis = async (type: "quick" | "full" | "deep" | "form") => {
    const validatedUrl = validateUrl(url)

    if (!validatedUrl) {
      setError("Please enter a valid URL (e.g., example.com or https://example.com)")
      return
    }

    setLoading(true)
    setLoadingType(type)
    setError("")
    setResults(null)
    setProgress(0)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 1000)

    try {
      let endpoint = ""
      let expectedTime = ""

      switch (type) {
        case "quick":
          endpoint = "/api/quick-links"
          expectedTime = "~30 seconds"
          break
        case "full":
          endpoint = "/api/analyze"
          expectedTime = "~2-3 minutes"
          break
        case "deep":
          endpoint = "/api/analyze-all-links"
          expectedTime = "~3-5 minutes"
          break
        case "form":
          endpoint = "/api/form-validation"
          expectedTime = "~1-2 minutes"
          break
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: validatedUrl }),
      })

      const data = await response.json()

      if (data.error && !data.internal_links && !data.forms_found) {
        setError(data.error)
      } else {
        setProgress(100)
        setResults(data)
        setActiveTab("overview")

        // Clear any previous errors if we got some results
        if (data.internal_links || data.forms_found !== undefined) {
          setError("")
        }
      }
    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : "Network error occurred"}`)
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      setLoadingType("")
      setProgress(0)
    }
  }

  const exportResults = (format: "json" | "csv" | "report") => {
    if (!results) return

    let content = ""
    let filename = ""
    let mimeType = ""

    const timestamp = new Date().toISOString().split("T")[0]
    const domain = results.url ? new URL(results.url).hostname : "website"

    switch (format) {
      case "json":
        content = JSON.stringify(results, null, 2)
        filename = `${domain}-audit-${timestamp}.json`
        mimeType = "application/json"
        break
      case "csv":
        content = generateCSV(results)
        filename = `${domain}-links-${timestamp}.csv`
        mimeType = "text/csv"
        break
      case "report":
        content = generateReport(results)
        filename = `${domain}-audit-report-${timestamp}.txt`
        mimeType = "text/plain"
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const generateCSV = (data: AnalysisResult) => {
    let csv =
      "Type,URL,Text,Title,Status,Buttons,Forms,Images,Headings,Videos,Accessibility Score,SEO Score,Performance Score\n"

    // For deep analysis, include analyzed data
    if (data.analyzed_data) {
      data.analyzed_data.forEach((link) => {
        csv += `"Analyzed","${link.url}","${(link.text || "").replace(/"/g, '""')}","${(link.title || "").replace(/"/g, '""')}","${link.status}",${link.elements?.buttons || 0},${link.elements?.forms || 0},${link.elements?.images || 0},${link.elements?.headings || 0},${link.elements?.videos || 0},${link.accessibility_score || 0},${link.seo_score || 0},${link.performance_score || 0}\n`
      })
    }

    // For regular analysis, include internal/external links
    data.internal_links?.forEach((link) => {
      csv += `"Internal","${link.url}","${(link.text || "").replace(/"/g, '""')}","${(link.title || "").replace(/"/g, '""')}","N/A",0,0,0,0,0,0,0,0\n`
    })

    data.external_links?.forEach((link) => {
      csv += `"External","${link.url}","${(link.text || "").replace(/"/g, '""')}","${(link.title || "").replace(/"/g, '""')}","N/A",0,0,0,0,0,0,0,0\n`
    })

    return csv
  }

  const generateReport = (data: AnalysisResult) => {
    const domain = data.url ? new URL(data.url).hostname : "Unknown"
    let report = `XERAUDITRON ANALYSIS REPORT\n`
    report += `${"=".repeat(50)}\n`
    report += `Domain: ${domain}\n`
    report += `URL: ${data.url || data.base_url}\n`
    report += `Generated: ${new Date().toLocaleString()}\n`
    report += `Analysis Type: ${data.summary ? "Deep Analysis" : data.forms_found !== undefined ? "Form Validation" : "Standard Analysis"}\n`
    report += `Analysis Method: ${data.method || "Standard"}\n`
    if (data.note) {
      report += `Note: ${data.note}\n`
    }
    report += `${"=".repeat(50)}\n\n`

    // Executive Summary
    report += `EXECUTIVE SUMMARY\n`
    report += `${"-".repeat(20)}\n`
    if (data.forms_found !== undefined) {
      // Form validation report
      report += `• ${data.total_pages_crawled || 0} pages crawled\n`
      report += `• ${data.forms_found} total forms found\n`
      report += `• ${data.forms_with_multiple_inputs} forms with 2+ input fields\n`
      report += `• ${Object.keys(data.form_types_breakdown || {}).length} different form types detected\n`
    } else if (data.summary) {
      report += `• ${data.analyzed_links || 0} pages successfully analyzed\n`
      report += `• ${data.summary.total_buttons + data.summary.total_forms + data.summary.total_images + data.summary.total_headings} total elements found\n`
      report += `• ${data.summary.average_accessibility_score?.toFixed(1) || 0}% average accessibility score\n`
      report += `• ${data.summary.average_seo_score?.toFixed(1) || 0}% average SEO score\n`
    } else {
      report += `• ${data.total_links || 0} total links found\n`
      report += `• ${data.internal_links?.length || 0} internal links\n`
      report += `• ${data.external_links?.length || 0} external links\n`
      if (data.elements?.accessibility?.score) {
        report += `• ${data.elements.accessibility.score}% accessibility score\n`
      }
    }
    report += `\n`

    // Form Analysis Section
    if (data.forms_found !== undefined && data.form_types_breakdown) {
      report += `FORM ANALYSIS\n`
      report += `${"-".repeat(20)}\n`
      Object.entries(data.form_types_breakdown).forEach(([type, count]) => {
        report += `• ${type}: ${count} forms\n`
      })
      report += `\n`

      if (data.detailed_forms && data.detailed_forms.length > 0) {
        report += `DETAILED FORM BREAKDOWN\n`
        report += `${"-".repeat(30)}\n`
        data.detailed_forms.forEach((form, index) => {
          report += `Form ${index + 1} (${form.form_classification}):\n`
          report += `  - Page: ${form.page_url}\n`
          report += `  - Input Fields: ${form.input_count}\n`
          report += `  - Input Types: ${form.input_types.join(", ")}\n`
          report += `  - Has Labels: ${form.has_labels ? "Yes" : "No"}\n`
          report += `  - Accessibility Score: ${form.accessibility_score}%\n`
          report += `\n`
        })
      }
    }

    // Technology Stack
    if (data.cms_detected) {
      report += `TECHNOLOGY STACK\n`
      report += `${"-".repeat(20)}\n`
      report += `Primary CMS: ${data.cms_detected.primary_cms || "Not detected"}\n`
      if (data.cms_detected.detected_systems && Object.keys(data.cms_detected.detected_systems).length > 0) {
        report += `Detected Systems:\n`
        Object.entries(data.cms_detected.detected_systems).forEach(([cms, details]: [string, any]) => {
          if (details.detected) {
            report += `  • ${cms} (${details.confidence}% confidence)\n`
          }
        })
      }
      report += `\n`
    }

    // Analytics & Marketing
    if (data.analytics_tools && data.analytics_tools.total_detected > 0) {
      report += `ANALYTICS & MARKETING TOOLS\n`
      report += `${"-".repeat(30)}\n`
      Object.entries(data.analytics_tools.detected_tools).forEach(([tool, details]: [string, any]) => {
        if (details.detected) {
          report += `• ${tool} (${details.category || "Unknown"})\n`
        }
      })
      report += `\n`
    }

    report += `\nReport generated by XERAUDITRON\n`
    return report
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-green-500"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-green-100">
      {/* Header */}
      <div className="glass-green border-b border-green-200 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Image
                src="/logo.png"
                alt="Xerago Logo"
                width={200}
                height={60}
                className="mr-4 drop-shadow-lg animate-pulse-green"
                priority
              />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 bg-clip-text text-transparent mb-3 animate-gradient-shift">
              XERAUDITRON
            </h1>
            <p className="text-xl text-green-700 mb-6 font-medium">
              Advanced Website Analysis & Digital Intelligence Platform
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-green-600">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">SEO Analysis</span>
              </div>
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-full">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium">Accessibility Check</span>
              </div>
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">Performance Insights</span>
              </div>
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-full">
                <Search className="h-4 w-4 text-green-600" />
                <span className="font-medium">CMS Detection</span>
              </div>
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-full">
                <Target className="h-4 w-4 text-green-600" />
                <span className="font-medium">Form Validation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* URL Input Section */}
        <Card className="mb-8 shadow-2xl border-0 glass-green">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl text-green-800 flex items-center gap-3">
              <Globe className="h-6 w-6 text-green-600" />
              Enter Website URL
            </CardTitle>
            <CardDescription className="text-base text-green-700">
              Analyze any website for comprehensive insights, SEO optimization, and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-6">
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
                <Input
                  type="url"
                  placeholder="example.com or https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-12 h-14 text-lg border-green-300 focus:border-green-500 focus:ring-green-500 bg-white/90 rounded-xl shadow-sm"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !loading) {
                      handleAnalysis("full")
                    }
                  }}
                />
              </div>

              {/* Analysis Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  className="border-2 border-green-300 gradient-green-primary text-white hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] animate-pulse-green"
                  onClick={() => !loading && handleAnalysis("quick")}
                >
                  <CardContent className="p-6 text-center">
                    <Zap className="h-10 w-10 mx-auto mb-3" />
                    <h3 className="text-xl font-bold mb-2">Quick Links</h3>
                    <p className="text-green-100 mb-3">Fast link extraction & basic analysis</p>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      <Badge variant="secondary" className="bg-green-400/20 text-green-100 border-green-300">
                        ~30 seconds
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] shadow-xl hover:shadow-2xl"
                  onClick={() => !loading && handleAnalysis("full")}
                >
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3" />
                    <h3 className="text-xl font-bold mb-2">Full Analysis</h3>
                    <p className="text-emerald-100 mb-3">Complete audit with SEO & accessibility</p>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      <Badge variant="secondary" className="bg-emerald-400/20 text-emerald-100 border-emerald-300">
                        ~2-3 minutes
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-2 border-green-400 bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] shadow-xl hover:shadow-2xl"
                  onClick={() => !loading && handleAnalysis("deep")}
                >
                  <CardContent className="p-6 text-center">
                    <Layers className="h-10 w-10 mx-auto mb-3" />
                    <h3 className="text-xl font-bold mb-2">Deep Analysis</h3>
                    <p className="text-green-100 mb-3">Multi-page element & performance analysis</p>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      <Badge variant="secondary" className="bg-green-400/20 text-green-100 border-green-300">
                        ~3-5 minutes
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-2 border-lime-300 bg-gradient-to-br from-lime-500 to-lime-600 text-white hover:from-lime-600 hover:to-lime-700 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] shadow-xl hover:shadow-2xl"
                  onClick={() => !loading && handleAnalysis("form")}
                >
                  <CardContent className="p-6 text-center">
                    <FileText className="h-10 w-10 mx-auto mb-3" />
                    <h3 className="text-xl font-bold mb-2">Form Validation</h3>
                    <p className="text-lime-100 mb-3">Find forms with 2+ input fields across site</p>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      <Badge variant="secondary" className="bg-lime-400/20 text-lime-100 border-lime-300">
                        ~1-2 minutes
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="mb-8 shadow-2xl glass-green border-0">
            <CardContent className="p-8 text-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div>
                <div className="absolute inset-0 rounded-full border-4 border-green-200 h-16 w-16 mx-auto"></div>
              </div>
              <h3 className="text-2xl font-semibold text-green-800 mb-3">
                {loadingType === "quick" && "Running Quick Analysis..."}
                {loadingType === "full" && "Running Full Analysis..."}
                {loadingType === "deep" && "Running Deep Analysis..."}
                {loadingType === "form" && "Running Form Validation..."}
              </h3>
              <p className="text-green-700 mb-4">
                {loadingType === "form"
                  ? "Crawling through website to find forms with multiple input fields..."
                  : loadingType === "deep"
                    ? "Analyzing multiple pages and counting elements across your website..."
                    : loadingType === "full"
                      ? "Performing comprehensive SEO, accessibility, and technical analysis..."
                      : "Extracting links and performing basic analysis..."}
              </p>
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-green-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-green-200" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert className="mb-8 border-red-200 bg-red-50/80 glass-green shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>Analysis Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Success/Method Notification */}
            {results.method && results.method !== "standard" && (
              <Alert className="border-green-200 bg-green-50/80 glass-green shadow-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Analysis Complete:</strong>{" "}
                  {results.note || `Successfully analyzed using ${results.method.replace(/_/g, " ")} method.`}
                </AlertDescription>
              </Alert>
            )}

            {/* Results Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-xl border-0 gradient-green-accent hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                        {results.forms_found !== undefined
                          ? "Pages Crawled"
                          : results.summary
                            ? "Pages Analyzed"
                            : "Total Links"}
                      </p>
                      <p className="text-3xl font-bold text-green-900">
                        {results.total_pages_crawled || results.analyzed_links || results.total_links || 0}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        {results.failed_links ? `${results.failed_links} failed` : "Successfully processed"}
                      </p>
                    </div>
                    <div className="p-3 bg-green-200 rounded-xl">
                      <Globe className="h-8 w-8 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 gradient-green-accent hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                        {results.forms_found !== undefined
                          ? "Forms Found"
                          : results.summary
                            ? "Total Elements"
                            : "Internal Links"}
                      </p>
                      <p className="text-3xl font-bold text-green-900">
                        {results.forms_found !== undefined
                          ? results.forms_found
                          : results.summary
                            ? (results.summary.total_buttons || 0) +
                              (results.summary.total_forms || 0) +
                              (results.summary.total_images || 0) +
                              (results.summary.total_headings || 0)
                            : results.internal_links?.length || 0}
                      </p>
                      <p className="text-sm text-emerald-600 mt-1">
                        {results.forms_found !== undefined ? "Interactive forms" : "Interactive components"}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-200 rounded-xl">
                      <Zap className="h-8 w-8 text-emerald-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 gradient-green-accent hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                        {results.forms_found !== undefined ? "Multi-Input Forms" : "Accessibility Score"}
                      </p>
                      <p
                        className={`text-3xl font-bold ${
                          results.forms_found !== undefined
                            ? "text-green-900"
                            : getScoreColor(
                                results.summary?.average_accessibility_score ||
                                  results.elements?.accessibility?.score ||
                                  0,
                              )
                        }`}
                      >
                        {results.forms_found !== undefined
                          ? results.forms_with_multiple_inputs || 0
                          : Math.round(
                              results.summary?.average_accessibility_score ||
                                results.elements?.accessibility?.score ||
                                0,
                            )}
                        {results.forms_found === undefined && "%"}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        {results.forms_found !== undefined ? "2+ input fields" : "WCAG compliance"}
                      </p>
                    </div>
                    <div className="p-3 bg-green-200 rounded-xl">
                      <Shield className="h-8 w-8 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 gradient-green-accent hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-lime-700 uppercase tracking-wide mb-1">
                        {results.forms_found !== undefined
                          ? "Form Types"
                          : results.summary
                            ? "SEO Score"
                            : "CMS Platform"}
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          results.forms_found !== undefined
                            ? "text-green-900"
                            : results.summary
                              ? getScoreColor(results.summary.average_seo_score || 0)
                              : "text-green-900"
                        }`}
                      >
                        {results.forms_found !== undefined
                          ? Object.keys(results.form_types_breakdown || {}).length
                          : results.summary
                            ? `${Math.round(results.summary.average_seo_score || 0)}%`
                            : results.cms_detected?.primary_cms || "None"}
                      </p>
                      <p className="text-sm text-lime-600 mt-1">
                        {results.forms_found !== undefined
                          ? "Different types"
                          : results.summary
                            ? "Search optimization"
                            : "Content management"}
                      </p>
                    </div>
                    <div className="p-3 bg-lime-200 rounded-xl">
                      <TrendingUp className="h-8 w-8 text-lime-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Validation Results */}
            {results.forms_found !== undefined && (
              <Card className="shadow-2xl border-0 gradient-green-accent">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl text-green-800 flex items-center gap-3">
                    <FileText className="h-6 w-6 text-green-600" />
                    Form Validation Summary
                  </CardTitle>
                  <CardDescription className="text-base text-green-700">
                    Comprehensive analysis of forms with multiple input fields across your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.form_types_breakdown && Object.keys(results.form_types_breakdown).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                      {Object.entries(results.form_types_breakdown).map(([type, count]) => (
                        <div
                          key={type}
                          className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300 hover:shadow-lg transition-shadow"
                        >
                          <div className="text-2xl mb-2">
                            {type.includes("Login")
                              ? "🔐"
                              : type.includes("Registration")
                                ? "📝"
                                : type.includes("Contact")
                                  ? "📞"
                                  : type.includes("Newsletter")
                                    ? "📧"
                                    : type.includes("Search")
                                      ? "🔍"
                                      : type.includes("Payment")
                                        ? "💳"
                                        : type.includes("Booking")
                                          ? "📅"
                                          : type.includes("Quote")
                                            ? "💰"
                                            : type.includes("Support")
                                              ? "🎧"
                                              : type.includes("Feedback")
                                                ? "⭐"
                                                : "📋"}
                          </div>
                          <p className="text-2xl font-bold text-green-700">{count}</p>
                          <p className="text-xs text-green-600 font-medium">{type}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.detailed_forms && results.detailed_forms.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-green-800 mb-4">Detailed Form Analysis</h4>
                      <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                        {results.detailed_forms.map((form, index) => (
                          <Card
                            key={index}
                            className="p-4 border border-green-200 bg-gradient-to-r from-green-50 to-white hover:shadow-md transition-shadow"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={form.page_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-800 font-medium break-all text-sm hover:underline flex items-center gap-2"
                                  >
                                    {form.page_url}
                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                  </a>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                                    {form.form_classification}
                                  </Badge>
                                  <Badge variant={getScoreBadgeVariant(form.accessibility_score)} className="text-xs">
                                    A11y: {form.accessibility_score}%
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
                                  <p className="font-bold text-green-700">{form.input_count}</p>
                                  <p className="text-green-600 font-medium">Input Fields</p>
                                </div>
                                <div className="text-center p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                                  <p className="font-bold text-emerald-700">{form.input_types.length}</p>
                                  <p className="text-emerald-600 font-medium">Input Types</p>
                                </div>
                                <div className="text-center p-3 bg-lime-100 rounded-lg border border-lime-200">
                                  <p className="font-bold text-lime-700">{form.has_labels ? "Yes" : "No"}</p>
                                  <p className="text-lime-600 font-medium">Has Labels</p>
                                </div>
                                <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
                                  <p className="font-bold text-green-700">{form.form_method}</p>
                                  <p className="text-green-600 font-medium">Method</p>
                                </div>
                              </div>
                              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                <strong>Input Types:</strong> {form.input_types.join(", ")}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Deep Analysis Summary */}
            {results.summary && (
              <Card className="shadow-2xl border-0 gradient-green-accent">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl text-green-800 flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                    Deep Analysis Summary
                  </CardTitle>
                  <CardDescription className="text-base text-green-700">
                    Comprehensive element distribution across all analyzed pages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {[
                      { key: "total_buttons", label: "Buttons", color: "green", icon: "🔘" },
                      { key: "total_forms", label: "Forms", color: "emerald", icon: "📝" },
                      { key: "total_images", label: "Images", color: "lime", icon: "🖼️" },
                      { key: "total_headings", label: "Headings", color: "green", icon: "📰" },
                      { key: "total_videos", label: "Videos", color: "emerald", icon: "🎥" },
                      { key: "total_calculators", label: "Calculators", color: "lime", icon: "🧮" },
                      { key: "total_banners", label: "Banners", color: "green", icon: "🎯" },
                      { key: "total_carousels", label: "Carousels", color: "emerald", icon: "🎠" },
                    ].map(({ key, label, color, icon }) => (
                      <div
                        key={key}
                        className={`text-center p-4 bg-gradient-to-br from-${color}-100 to-${color}-200 rounded-xl border border-${color}-300 hover:shadow-lg transition-shadow`}
                      >
                        <div className="text-2xl mb-2">{icon}</div>
                        <p className={`text-2xl font-bold text-${color}-800`}>{results.summary?.[key] || 0}</p>
                        <p className={`text-xs text-${color}-700 font-medium`}>{label}</p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6 bg-green-200" />

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300">
                      <p className="text-lg font-semibold text-green-800 mb-1">Pages with Forms</p>
                      <p className="text-2xl font-bold text-green-900">{results.summary.pages_with_forms}</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl border border-emerald-300">
                      <p className="text-lg font-semibold text-emerald-800 mb-1">Pages with Images</p>
                      <p className="text-2xl font-bold text-emerald-900">{results.summary.pages_with_images}</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-lime-100 to-lime-200 rounded-xl border border-lime-300">
                      <p className="text-lg font-semibold text-lime-800 mb-1">Avg Accessibility</p>
                      <p
                        className={`text-2xl font-bold ${getScoreColor(results.summary.average_accessibility_score || 0)}`}
                      >
                        {(results.summary.average_accessibility_score || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300">
                      <p className="text-lg font-semibold text-green-800 mb-1">Avg SEO Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(results.summary.average_seo_score || 0)}`}>
                        {(results.summary.average_seo_score || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Results Tabs */}
            <Card className="shadow-2xl border-0 glass-green">
              <CardHeader>
                <CardTitle className="text-2xl text-green-800">Detailed Analysis Results</CardTitle>
                <CardDescription className="text-base text-green-700">
                  Comprehensive breakdown of your website analysis with actionable insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-green-100 p-1 rounded-xl">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="links"
                      className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {results.analyzed_data ? "Pages" : results.forms_found !== undefined ? "Forms" : "Links"}
                    </TabsTrigger>
                    <TabsTrigger
                      value="cms"
                      className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Technology
                    </TabsTrigger>
                    <TabsTrigger
                      value="elements"
                      className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg"
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Elements
                    </TabsTrigger>
                    <TabsTrigger
                      value="seo"
                      className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      SEO
                    </TabsTrigger>
                    <TabsTrigger
                      value="export"
                      className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-8">
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {results.cms_detected && (
                          <Card className="border border-green-200 gradient-green-accent shadow-lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-3 text-xl text-green-800">
                                <Settings className="h-6 w-6 text-green-600" />
                                Technology Stack
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                                  <span className="font-medium text-green-800">Primary CMS:</span>
                                  <Badge
                                    variant={results.cms_detected.primary_cms ? "default" : "secondary"}
                                    className="bg-green-200 text-green-800 border-green-300 px-3 py-1"
                                  >
                                    {results.cms_detected.primary_cms || "Not detected"}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                  <span className="font-medium text-green-800">Systems Found:</span>
                                  <span className="text-xl font-bold text-green-700">
                                    {results.cms_detected.total_detected}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {results.analytics_tools && (
                          <Card className="border border-green-200 gradient-green-accent shadow-lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-3 text-xl text-green-800">
                                <BarChart3 className="h-6 w-6 text-green-600" />
                                Analytics & Marketing
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                                  <span className="font-medium text-green-800">Tools Detected:</span>
                                  <span className="text-xl font-bold text-green-700">
                                    {results.analytics_tools.total_detected}
                                  </span>
                                </div>
                                {results.analytics_tools.total_detected > 0 && (
                                  <div className="space-y-2">
                                    {Object.entries(results.analytics_tools.detected_tools).map(
                                      ([tool, details]: [string, any]) =>
                                        details.detected && (
                                          <div
                                            key={tool}
                                            className="flex items-center justify-between p-2 bg-white rounded border border-green-200"
                                          >
                                            <span className="text-sm font-medium text-green-800">{tool}</span>
                                            <Badge
                                              variant="outline"
                                              className="text-xs border-green-300 text-green-700"
                                            >
                                              {details.category}
                                            </Badge>
                                          </div>
                                        ),
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {results.elements && (
                        <Card className="border border-green-200 gradient-green-accent shadow-lg">
                          <CardHeader>
                            <CardTitle className="text-xl text-green-800">Page Elements Overview</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300">
                                <p className="text-2xl font-bold text-green-700 mb-1">
                                  {results.elements.headings?.total_headings || 0}
                                </p>
                                <p className="text-sm font-medium text-green-800">Headings</p>
                                {results.elements.headings?.has_h1 && (
                                  <Badge variant="outline" className="mt-2 text-xs border-green-400 text-green-700">
                                    H1 Present
                                  </Badge>
                                )}
                              </div>
                              <div className="text-center p-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl border border-emerald-300">
                                <p className="text-2xl font-bold text-emerald-700 mb-1">
                                  {results.elements.images?.total_images || 0}
                                </p>
                                <p className="text-sm font-medium text-emerald-800">Images</p>
                                <Badge
                                  variant={
                                    (results.elements.images?.alt_text_percentage || 0) >= 90
                                      ? "default"
                                      : "destructive"
                                  }
                                  className="mt-2 text-xs"
                                >
                                  {(results.elements.images?.alt_text_percentage || 0).toFixed(0)}% Alt Text
                                </Badge>
                              </div>
                              <div className="text-center p-4 bg-gradient-to-br from-lime-100 to-lime-200 rounded-xl border border-lime-300">
                                <p className="text-2xl font-bold text-lime-700 mb-1">
                                  {results.elements.forms?.total_forms || 0}
                                </p>
                                <p className="text-sm font-medium text-lime-800">Forms</p>
                                {(results.elements.forms?.total_forms || 0) > 0 && (
                                  <Badge variant="outline" className="mt-2 text-xs border-lime-400 text-lime-700">
                                    Interactive
                                  </Badge>
                                )}
                              </div>
                              <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300">
                                <p
                                  className={`text-2xl font-bold mb-1 ${getScoreColor(results.elements.accessibility?.score || 0)}`}
                                >
                                  {results.elements.accessibility?.score || 0}%
                                </p>
                                <p className="text-sm font-medium text-green-800">Accessibility</p>
                                <Badge
                                  variant={getScoreBadgeVariant(results.elements.accessibility?.score || 0)}
                                  className="mt-2 text-xs"
                                >
                                  {(results.elements.accessibility?.score || 0) >= 80
                                    ? "Good"
                                    : (results.elements.accessibility?.score || 0) >= 60
                                      ? "Fair"
                                      : "Poor"}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="links" className="mt-8">
                    <div className="space-y-6">
                      {results.forms_found !== undefined ? (
                        // Form validation results
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-green-800">Form Analysis Results</h3>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="border-green-300 text-green-700">
                                ✅ {results.forms_found} forms found
                              </Badge>
                              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                                📝 {results.forms_with_multiple_inputs} multi-input
                              </Badge>
                            </div>
                          </div>

                          {results.detailed_forms && results.detailed_forms.length > 0 ? (
                            <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2">
                              {results.detailed_forms.map((form, index) => (
                                <Card
                                  key={index}
                                  className="p-6 border border-green-200 gradient-green-accent hover:shadow-lg transition-shadow"
                                >
                                  <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 min-w-0">
                                        <a
                                          href={form.page_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-green-600 hover:text-green-800 font-medium break-all text-sm hover:underline flex items-center gap-2"
                                        >
                                          {form.page_url}
                                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                        </a>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                                          {form.form_classification}
                                        </Badge>
                                        <Badge
                                          variant={getScoreBadgeVariant(form.accessibility_score)}
                                          className="text-xs"
                                        >
                                          A11y: {form.accessibility_score}%
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                      <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
                                        <p className="font-bold text-green-700">{form.input_count}</p>
                                        <p className="text-green-600 font-medium">Input Fields</p>
                                      </div>
                                      <div className="text-center p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                                        <p className="font-bold text-emerald-700">{form.input_types.length}</p>
                                        <p className="text-emerald-600 font-medium">Input Types</p>
                                      </div>
                                      <div className="text-center p-3 bg-lime-100 rounded-lg border border-lime-200">
                                        <p className="font-bold text-lime-700">{form.has_labels ? "Yes" : "No"}</p>
                                        <p className="text-lime-600 font-medium">Has Labels</p>
                                      </div>
                                      <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
                                        <p className="font-bold text-green-700">{form.form_method}</p>
                                        <p className="text-green-600 font-medium">Method</p>
                                      </div>
                                    </div>
                                    <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                                      <strong>Input Types:</strong> {form.input_types.join(", ")}
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200">
                              <FileText className="h-12 w-12 text-green-400 mx-auto mb-4" />
                              <p className="text-green-700 text-lg">No forms with multiple inputs found</p>
                              <p className="text-green-600 text-sm mt-2">
                                The website may not have complex forms or they may be dynamically loaded
                              </p>
                            </div>
                          )}
                        </div>
                      ) : results.analyzed_data ? (
                        // Deep analysis results
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-green-800">Page-by-Page Analysis</h3>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="border-green-300 text-green-700">
                                ✅ {results.analyzed_data.length} analyzed
                              </Badge>
                              {(results.failed_links || 0) > 0 && (
                                <Badge variant="outline" className="border-red-200 text-red-700">
                                  ❌ {results.failed_links} failed
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2">
                            {results.analyzed_data.map((page: any, index: number) => (
                              <Card
                                key={index}
                                className="p-6 border border-green-200 gradient-green-accent hover:shadow-lg transition-shadow"
                              >
                                <div className="space-y-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <a
                                        href={page.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:text-green-800 font-medium break-all text-sm hover:underline flex items-center gap-2"
                                      >
                                        {page.url}
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                      </a>
                                      {page.text && (
                                        <p className="text-xs text-green-700 bg-green-100 p-2 rounded mt-2 line-clamp-2">
                                          {page.text}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Badge
                                        variant={page.status === "✅" ? "default" : "destructive"}
                                        className="text-xs"
                                      >
                                        {page.status}
                                      </Badge>
                                      {page.accessibility_score && (
                                        <Badge
                                          variant={getScoreBadgeVariant(page.accessibility_score)}
                                          className="text-xs"
                                        >
                                          A11y: {page.accessibility_score}%
                                        </Badge>
                                      )}
                                      {page.seo_score && (
                                        <Badge variant={getScoreBadgeVariant(page.seo_score)} className="text-xs">
                                          SEO: {page.seo_score}%
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 md:grid-cols-8 gap-3 text-xs">
                                    {[
                                      { key: "buttons", label: "Buttons", color: "green" },
                                      { key: "forms", label: "Forms", color: "emerald" },
                                      { key: "images", label: "Images", color: "lime" },
                                      { key: "headings", label: "Headings", color: "green" },
                                      { key: "videos", label: "Videos", color: "emerald" },
                                      { key: "calculators", label: "Calc", color: "lime" },
                                      { key: "banners", label: "Banners", color: "green" },
                                      { key: "carousels", label: "Carousel", color: "emerald" },
                                    ].map(({ key, label, color }) => (
                                      <div
                                        key={key}
                                        className={`text-center p-3 bg-${color}-100 rounded-lg border border-${color}-200`}
                                      >
                                        <p className={`font-bold text-${color}-700`}>{page.elements?.[key] || 0}</p>
                                        <p className={`text-${color}-600 font-medium`}>{label}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ) : (
                        // Regular link analysis
                        <Tabs defaultValue="internal">
                          <TabsList className="bg-green-100">
                            <TabsTrigger
                              value="internal"
                              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                            >
                              Internal Links ({results.internal_links?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger
                              value="external"
                              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                            >
                              External Links ({results.external_links?.length || 0})
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="internal" className="mt-6">
                            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                              {results.internal_links?.map((link, index) => (
                                <Card
                                  key={index}
                                  className="p-4 border border-green-200 gradient-green-accent hover:shadow-md transition-shadow"
                                >
                                  <div>
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-green-600 hover:text-green-800 font-medium break-all hover:underline flex items-center gap-2"
                                    >
                                      {link.url}
                                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    </a>
                                    {link.text && (
                                      <p className="text-sm text-green-700 mt-2 bg-green-50 p-2 rounded line-clamp-2">
                                        {link.text}
                                      </p>
                                    )}
                                    {link.title && (
                                      <p className="text-xs text-green-600 mt-1 italic">Title: {link.title}</p>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="external" className="mt-6">
                            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                              {results.external_links?.map((link, index) => (
                                <Card
                                  key={index}
                                  className="p-4 border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white hover:shadow-md transition-shadow"
                                >
                                  <div>
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-600 hover:text-emerald-800 font-medium break-all hover:underline flex items-center gap-2"
                                    >
                                      {link.url}
                                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    </a>
                                    {link.text && (
                                      <p className="text-sm text-emerald-700 mt-2 bg-emerald-50 p-2 rounded line-clamp-2">
                                        {link.text}
                                      </p>
                                    )}
                                    {link.title && (
                                      <p className="text-xs text-emerald-600 mt-1 italic">Title: {link.title}</p>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="cms" className="mt-8">
                    <div className="space-y-8">
                      {results.cms_detected && (
                        <Card className="border border-green-200 gradient-green-accent shadow-lg">
                          <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-3 text-green-800">
                              <Settings className="h-6 w-6 text-green-600" />
                              Content Management System Detection
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              <div className="p-4 bg-green-100 rounded-xl border border-green-300">
                                <h4 className="font-semibold mb-3 text-green-900">Primary CMS Platform</h4>
                                <Badge
                                  variant={results.cms_detected.primary_cms ? "default" : "secondary"}
                                  className="text-lg px-4 py-2 bg-green-200 text-green-800 border-green-300"
                                >
                                  {results.cms_detected.primary_cms || "Not detected"}
                                </Badge>
                              </div>

                              {results.cms_detected.detected_systems &&
                                Object.keys(results.cms_detected.detected_systems).length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-4 text-green-900">All Detected Systems</h4>
                                    <div className="grid gap-4">
                                      {Object.entries(results.cms_detected.detected_systems).map(
                                        ([cms, details]: [string, any]) => (
                                          <div
                                            key={cms}
                                            className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-200 hover:shadow-md transition-shadow"
                                          >
                                            <div>
                                              <span className="font-medium text-lg text-green-900">{cms}</span>
                                              {details.evidence && details.evidence.length > 0 && (
                                                <p className="text-sm text-green-700 mt-1">
                                                  Evidence: {details.evidence.slice(0, 2).join(", ")}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <Badge
                                                variant={details.detected ? "default" : "secondary"}
                                                className="bg-green-200 text-green-800"
                                              >
                                                {details.detected ? "✅ Confirmed" : "❓ Possible"}
                                              </Badge>
                                              <Badge variant="outline" className="border-green-300 text-green-700">
                                                {details.confidence}% confidence
                                              </Badge>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {results.analytics_tools && (
                        <Card className="border border-green-200 gradient-green-accent shadow-lg">
                          <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-3 text-green-800">
                              <BarChart3 className="h-6 w-6 text-green-600" />
                              Analytics & Marketing Tools
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              {results.analytics_tools.detected_tools &&
                              Object.keys(results.analytics_tools.detected_tools).length > 0 ? (
                                <div className="grid gap-4">
                                  {Object.entries(results.analytics_tools.detected_tools).map(
                                    ([tool, details]: [string, any]) =>
                                      details.detected && (
                                        <div
                                          key={tool}
                                          className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-200 hover:shadow-md transition-shadow"
                                        >
                                          <div>
                                            <span className="font-medium text-lg text-green-900">{tool}</span>
                                            <p className="text-sm text-green-700 mt-1">
                                              Category: {details.category || "Analytics"}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <Badge variant="default" className="bg-green-200 text-green-800">
                                              ✅ Active
                                            </Badge>
                                            <Badge variant="outline" className="border-green-300 text-green-700">
                                              {details.confidence}% confidence
                                            </Badge>
                                          </div>
                                        </div>
                                      ),
                                  )}
                                </div>
                              ) : (
                                <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200">
                                  <BarChart3 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                                  <p className="text-green-700 text-lg">No analytics tools detected</p>
                                  <p className="text-green-600 text-sm mt-2">
                                    Consider implementing Google Analytics or similar tools for better insights
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="elements" className="mt-8">
                    {results.elements && !results.elements.error ? (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <Card className="border border-green-200 gradient-green-accent shadow-lg">
                            <CardHeader>
                              <CardTitle className="text-xl flex items-center gap-3 text-green-800">
                                <FileText className="h-6 w-6 text-green-600" />
                                Heading Structure Analysis
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {results.elements.headings?.structure &&
                                  Object.entries(results.elements.headings.structure).map(
                                    ([tag, count]: [string, any]) =>
                                      count > 0 && (
                                        <div
                                          key={tag}
                                          className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                                        >
                                          <span className="font-medium text-green-800">{tag.toUpperCase()} Tags</span>
                                          <Badge
                                            variant="outline"
                                            className="border-green-300 text-green-700 text-base px-3 py-1"
                                          >
                                            {count}
                                          </Badge>
                                        </div>
                                      ),
                                  )}

                                {results.elements.headings?.content_sample && (
                                  <div className="mt-6">
                                    <h5 className="font-medium text-green-800 mb-3">Sample Headings:</h5>
                                    <div className="space-y-2">
                                      {Object.entries(results.elements.headings.content_sample).map(
                                        ([tag, headings]: [string, any]) =>
                                          headings.length > 0 && (
                                            <div key={tag} className="text-sm">
                                              <span className="font-medium text-green-700">{tag.toUpperCase()}:</span>
                                              <ul className="ml-4 mt-1 space-y-1">
                                                {headings.slice(0, 3).map((heading: string, idx: number) => (
                                                  <li key={idx} className="text-green-600 truncate">
                                                    • {heading}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          ),
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border border-green-200 gradient-green-accent shadow-lg">
                            <CardHeader>
                              <CardTitle className="text-xl flex items-center gap-3 text-green-800">
                                <Eye className="h-6 w-6 text-green-600" />
                                Image Analysis
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                                  <span className="font-medium text-green-800">Total Images</span>
                                  <Badge
                                    variant="outline"
                                    className="border-green-300 text-green-700 text-base px-3 py-1"
                                  >
                                    {results.elements.images?.total_images || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-emerald-100 rounded-lg">
                                  <span className="font-medium text-green-800">With Alt Text</span>
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-300 text-emerald-700 text-base px-3 py-1"
                                  >
                                    {results.elements.images?.with_alt_text || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg">
                                  <span className="font-medium text-green-800">Missing Alt Text</span>
                                  <Badge variant="outline" className="border-red-200 text-red-700 text-base px-3 py-1">
                                    {results.elements.images?.missing_alt_text || 0}
                                  </Badge>
                                </div>
                                <div className="mt-4">
                                  <div className="flex justify-between text-sm text-green-700 mb-2">
                                    <span>Alt Text Coverage</span>
                                    <span>{(results.elements.images?.alt_text_percentage || 0).toFixed(1)}%</span>
                                  </div>
                                  <Progress value={results.elements.images?.alt_text_percentage || 0} className="h-2" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <Card className="border border-green-200 gradient-green-accent shadow-lg">
                            <CardHeader>
                              <CardTitle className="text-xl flex items-center gap-3 text-green-800">
                                <FileText className="h-6 w-6 text-green-600" />
                                Forms & Interactivity
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                                  <span className="font-medium text-green-800">Total Forms</span>
                                  <Badge
                                    variant="outline"
                                    className="border-green-300 text-green-700 text-base px-3 py-1"
                                  >
                                    {results.elements.forms?.total_forms || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-emerald-100 rounded-lg">
                                  <span className="font-medium text-green-800">Input Fields</span>
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-300 text-emerald-700 text-base px-3 py-1"
                                  >
                                    {results.elements.forms?.total_inputs || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-lime-100 rounded-lg">
                                  <span className="font-medium text-green-800">Buttons</span>
                                  <Badge
                                    variant="outline"
                                    className="border-lime-300 text-lime-700 text-base px-3 py-1"
                                  >
                                    {results.elements.forms?.total_buttons || 0}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border border-green-200 gradient-green-accent shadow-lg">
                            <CardHeader>
                              <CardTitle className="text-xl flex items-center gap-3 text-green-800">
                                <Shield className="h-6 w-6 text-green-600" />
                                Accessibility Score
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="text-center p-6 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                                  <p
                                    className={`text-4xl font-bold mb-2 ${getScoreColor(results.elements.accessibility?.score || 0)}`}
                                  >
                                    {results.elements.accessibility?.score || 0}%
                                  </p>
                                  <p className="text-green-800 font-medium">Overall Score</p>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-green-800">Issues Found:</span>
                                    <span className="font-medium text-green-700">
                                      {results.elements.accessibility?.issues_found || 0}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-green-800">Images without Alt:</span>
                                    <span className="font-medium text-green-700">
                                      {results.elements.accessibility?.images_without_alt || 0}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-green-800">Links without Text:</span>
                                    <span className="font-medium text-green-700">
                                      {results.elements.accessibility?.links_without_text || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200">
                        <AlertCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <p className="text-green-700 text-lg">Element analysis not available</p>
                        <p className="text-green-600 text-sm mt-2">
                          {results.elements?.error || "No element data found in the analysis results"}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="seo" className="mt-8">
                    {results.elements?.meta_tags ? (
                      <div className="space-y-8">
                        <Card className="border border-green-200 gradient-green-accent shadow-lg">
                          <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-3 text-green-800">
                              <Search className="h-6 w-6 text-green-600" />
                              SEO Meta Tags Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-green-900">Essential Meta Tags</h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                      <span className="font-medium text-green-800">Description</span>
                                      <Badge
                                        variant={results.elements.meta_tags.has_description ? "default" : "destructive"}
                                      >
                                        {results.elements.meta_tags.has_description ? "✅ Present" : "❌ Missing"}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                      <span className="font-medium text-green-800">Viewport</span>
                                      <Badge
                                        variant={results.elements.meta_tags.has_viewport ? "default" : "destructive"}
                                      >
                                        {results.elements.meta_tags.has_viewport ? "✅ Present" : "❌ Missing"}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                      <span className="font-medium text-green-800">Total Meta Tags</span>
                                      <Badge variant="outline" className="border-green-300 text-green-700">
                                        {results.elements.meta_tags.total_meta_tags}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="font-semibold text-green-900">Heading Structure</h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                      <span className="font-medium text-green-800">H1 Tag</span>
                                      <Badge variant={results.elements.headings?.has_h1 ? "default" : "destructive"}>
                                        {results.elements.headings?.has_h1 ? "✅ Present" : "❌ Missing"}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                      <span className="font-medium text-green-800">Multiple H1s</span>
                                      <Badge
                                        variant={results.elements.headings?.multiple_h1 ? "destructive" : "default"}
                                      >
                                        {results.elements.headings?.multiple_h1 ? "⚠️ Yes" : "✅ No"}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                      <span className="font-medium text-green-800">Total Headings</span>
                                      <Badge variant="outline" className="border-green-300 text-green-700">
                                        {results.elements.headings?.total_headings || 0}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {results.elements.meta_tags.important_tags &&
                                Object.keys(results.elements.meta_tags.important_tags).length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-green-900 mb-4">Meta Tag Content</h4>
                                    <div className="space-y-3">
                                      {Object.entries(results.elements.meta_tags.important_tags).map(
                                        ([tag, content]: [string, any]) => (
                                          <div
                                            key={tag}
                                            className="p-4 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-200"
                                          >
                                            <div className="flex items-start justify-between gap-4">
                                              <div className="flex-1">
                                                <span className="font-medium text-green-800 capitalize">{tag}:</span>
                                                <p className="text-sm text-green-700 mt-1 break-words">{content}</p>
                                              </div>
                                              <Badge
                                                variant="outline"
                                                className="text-xs border-green-300 text-green-700"
                                              >
                                                {content.length} chars
                                              </Badge>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200">
                        <Search className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <p className="text-green-700 text-lg">SEO analysis not available</p>
                        <p className="text-green-600 text-sm mt-2">No SEO data found in the analysis results</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="export" className="mt-8">
                    <div className="space-y-8">
                      <Card className="border border-green-200 gradient-green-accent shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-3 text-green-800">
                            <Download className="h-6 w-6 text-green-600" />
                            Export Analysis Results
                          </CardTitle>
                          <CardDescription className="text-green-700">
                            Download your XERAUDITRON analysis results in various formats for reporting and analysis
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card
                              className="border-2 border-green-300 hover:border-green-400 transition-colors cursor-pointer"
                              onClick={() => exportResults("json")}
                            >
                              <CardContent className="p-6 text-center">
                                <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2 text-green-800">JSON Export</h3>
                                <p className="text-sm text-green-700 mb-4">
                                  Complete raw data in JSON format for developers and advanced analysis
                                </p>
                                <Button
                                  variant="outline"
                                  className="w-full bg-transparent border-green-300 text-green-700 hover:bg-green-50"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download JSON
                                </Button>
                              </CardContent>
                            </Card>

                            <Card
                              className="border-2 border-emerald-300 hover:border-emerald-400 transition-colors cursor-pointer"
                              onClick={() => exportResults("csv")}
                            >
                              <CardContent className="p-6 text-center">
                                <BarChart3 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2 text-emerald-800">CSV Export</h3>
                                <p className="text-sm text-emerald-700 mb-4">
                                  Structured data in CSV format for spreadsheet analysis and reporting
                                </p>
                                <Button
                                  variant="outline"
                                  className="w-full bg-transparent border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download CSV
                                </Button>
                              </CardContent>
                            </Card>

                            <Card
                              className="border-2 border-lime-300 hover:border-lime-400 transition-colors cursor-pointer"
                              onClick={() => exportResults("report")}
                            >
                              <CardContent className="p-6 text-center">
                                <FileText className="h-12 w-12 text-lime-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2 text-lime-800">Text Report</h3>
                                <p className="text-sm text-lime-700 mb-4">
                                  Human-readable summary report with recommendations and insights
                                </p>
                                <Button
                                  variant="outline"
                                  className="w-full bg-transparent border-lime-300 text-lime-700 hover:bg-lime-50"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Report
                                </Button>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="mt-8 p-6 bg-green-100 rounded-xl border border-green-300">
                            <h4 className="font-semibold text-green-900 mb-3">Export Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-green-800 mb-1">Analysis Date:</p>
                                <p className="text-green-700">{new Date(results.timestamp).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="font-medium text-green-800 mb-1">Website:</p>
                                <p className="text-green-700 break-all">{results.url || results.base_url}</p>
                              </div>
                              <div>
                                <p className="font-medium text-green-800 mb-1">Analysis Type:</p>
                                <p className="text-green-700">
                                  {results.forms_found !== undefined
                                    ? "Form Validation"
                                    : results.summary
                                      ? "Deep Analysis"
                                      : results.analyzed_data
                                        ? "Page Analysis"
                                        : "Standard Analysis"}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-green-800 mb-1">Data Points:</p>
                                <p className="text-green-700">
                                  {results.forms_found !== undefined
                                    ? `${results.forms_found} forms analyzed`
                                    : `${results.analyzed_links || results.total_links || 0} items analyzed`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
