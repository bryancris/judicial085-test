
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ContractDraftFormProps {
  onSubmit: (data: any) => void;
}

const ContractDraftForm: React.FC<ContractDraftFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    contractType: "",
    industry: "",
    party1Name: "",
    party1DefinedName: "",
    party2Name: "",
    party2DefinedName: "",
    governingLaw: "",
    jurisdiction: "",
    factsGuidance: "",
    whoToFavor: "neutral",
    howLengthy: "neutral",
    styleOptions: {
      simplePlainLanguage: false,
      modernLegalWriting: false,
      traditionalLegalWriting: false
    },
    followUpQuestions: 3
  });

  const contractTypes = [
    "Service Agreement",
    "Employment Contract",
    "Non-Disclosure Agreement (NDA)",
    "Purchase Agreement",
    "Lease Agreement",
    "Partnership Agreement",
    "Independent Contractor Agreement",
    "License Agreement",
    "Distribution Agreement",
    "Consulting Agreement",
    "Supply Agreement",
    "Franchise Agreement",
    "Joint Venture Agreement",
    "Merger Agreement",
    "Asset Purchase Agreement"
  ];

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Real Estate",
    "Manufacturing",
    "Retail",
    "Construction",
    "Energy",
    "Transportation",
    "Education",
    "Entertainment",
    "Food & Beverage",
    "Legal Services",
    "Consulting",
    "Other"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStyleOptionChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      styleOptions: {
        ...prev.styleOptions,
        [option]: checked
      }
    }));
  };

  return (
    <div className="bg-white p-6 max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contract Type and Industry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contractType" className="text-sm font-medium">
              Type of Contract *
            </Label>
            <Select value={formData.contractType} onValueChange={(value) => handleInputChange('contractType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select contract type" />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-sm font-medium">
              Industry
            </Label>
            <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Party Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Party Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="party1Name" className="text-sm font-medium">
                  Party 1 Name *
                </Label>
                <Input
                  id="party1Name"
                  value={formData.party1Name}
                  onChange={(e) => handleInputChange('party1Name', e.target.value)}
                  placeholder="Enter party 1 name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="party1DefinedName" className="text-sm font-medium">
                  Party 1 Defined Name
                </Label>
                <Input
                  id="party1DefinedName"
                  value={formData.party1DefinedName}
                  onChange={(e) => handleInputChange('party1DefinedName', e.target.value)}
                  placeholder="e.g., Company, Client, Buyer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="party2Name" className="text-sm font-medium">
                  Party 2 Name *
                </Label>
                <Input
                  id="party2Name"
                  value={formData.party2Name}
                  onChange={(e) => handleInputChange('party2Name', e.target.value)}
                  placeholder="Enter party 2 name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="party2DefinedName" className="text-sm font-medium">
                  Party 2 Defined Name
                </Label>
                <Input
                  id="party2DefinedName"
                  value={formData.party2DefinedName}
                  onChange={(e) => handleInputChange('party2DefinedName', e.target.value)}
                  placeholder="e.g., Contractor, Vendor, Seller"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="governingLaw" className="text-sm font-medium">
              Governing Law (Country)
            </Label>
            <Select value={formData.governingLaw} onValueChange={(value) => handleInputChange('governingLaw', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jurisdiction" className="text-sm font-medium">
              Jurisdiction (State/Province)
            </Label>
            <Input
              id="jurisdiction"
              value={formData.jurisdiction}
              onChange={(e) => handleInputChange('jurisdiction', e.target.value)}
              placeholder="e.g., Texas, California, New York"
            />
          </div>
        </div>

        {/* Facts and Guidance */}
        <div className="space-y-2">
          <Label htmlFor="factsGuidance" className="text-sm font-medium">
            Facts to Consider / Guidance
          </Label>
          <Textarea
            id="factsGuidance"
            value={formData.factsGuidance}
            onChange={(e) => handleInputChange('factsGuidance', e.target.value)}
            placeholder="Provide any specific details, requirements, or guidance for the contract..."
            className="min-h-[100px]"
          />
        </div>

        <Separator />

        {/* Optional Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Optional Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Who to Favor */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Who to favor</Label>
              <RadioGroup
                value={formData.whoToFavor}
                onValueChange={(value) => handleInputChange('whoToFavor', value)}
                className="flex flex-row space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="party1" id="favor-party1" />
                  <Label htmlFor="favor-party1" className="text-sm">Party 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="neutral" id="favor-neutral" />
                  <Label htmlFor="favor-neutral" className="text-sm">Neutral</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="party2" id="favor-party2" />
                  <Label htmlFor="favor-party2" className="text-sm">Party 2</Label>
                </div>
              </RadioGroup>
            </div>

            {/* How Lengthy */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">How lengthy</Label>
              <RadioGroup
                value={formData.howLengthy}
                onValueChange={(value) => handleInputChange('howLengthy', value)}
                className="flex flex-row space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="lengthy-simple" />
                  <Label htmlFor="lengthy-simple" className="text-sm">Simple</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="neutral" id="lengthy-neutral" />
                  <Label htmlFor="lengthy-neutral" className="text-sm">Neutral</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="robust" id="lengthy-robust" />
                  <Label htmlFor="lengthy-robust" className="text-sm">Robust</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Style of Legal Writing */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Style of legal writing</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="simple-plain"
                    checked={formData.styleOptions.simplePlainLanguage}
                    onCheckedChange={(checked) => handleStyleOptionChange('simplePlainLanguage', checked as boolean)}
                  />
                  <Label htmlFor="simple-plain" className="text-sm">Simple Plain Language</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="modern-legal"
                    checked={formData.styleOptions.modernLegalWriting}
                    onCheckedChange={(checked) => handleStyleOptionChange('modernLegalWriting', checked as boolean)}
                  />
                  <Label htmlFor="modern-legal" className="text-sm">Modern Legal Writing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="traditional-legal"
                    checked={formData.styleOptions.traditionalLegalWriting}
                    onCheckedChange={(checked) => handleStyleOptionChange('traditionalLegalWriting', checked as boolean)}
                  />
                  <Label htmlFor="traditional-legal" className="text-sm">Traditional Legal Writing</Label>
                </div>
              </div>
            </div>

            {/* Follow-up Questions */}
            <div className="space-y-2">
              <Label htmlFor="followUpQuestions" className="text-sm font-medium">
                Number of follow-up questions
              </Label>
              <Select 
                value={formData.followUpQuestions.toString()} 
                onValueChange={(value) => handleInputChange('followUpQuestions', parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button type="submit" className="bg-[#4CAF50] hover:bg-[#3d8b40] text-white px-8">
            Generate Contract
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContractDraftForm;
