import React from 'react';
import { useState, useEffect } from 'react';
import { Container, Tabs, Card, Button, Group, Select, Textarea, Stack } from '@mantine/core';
import { IconFileText, IconFileDescription, IconDownload, IconUpload } from '@tabler/icons-react';
import { llmService } from '../services/api';
import { useAppStore } from '../store';
import { DOCUMENT_TYPES, type DocumentType, type DocumentTemplate } from '../types';

export const Documents: React.FC = () => {
  const { isLoading: loading, setLoading } = useAppStore();
  const [activeTab, setActiveTab] = useState<DocumentType>('cv');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');

  // Helper to get the current tab as a DocumentType (type-safe)
  const getCurrentDocumentType = (): DocumentType => {
    return activeTab;
  };

  // Type-safe tab change handler
  const handleTabChange = (value: string | null) => {
    if (value && DOCUMENT_TYPES.includes(value as DocumentType)) {
      setActiveTab(value as DocumentType);
    }
  };

  // Load templates for the current tab
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const allTemplates = await llmService.getDocumentTemplates();
      const filteredTemplates = allTemplates.filter(t => t.type === getCurrentDocumentType());
      setTemplates(filteredTemplates);
      setSelectedTemplate(filteredTemplates[0]?.id.toString() || null);
    } finally {
      setLoading(false);
    }
  };

  // Generate document with strict type checking
  const generateDocument = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    try {
      const result = await llmService.generateDocument(
        1, // jobId would normally come from props/state
        parseInt(selectedTemplate),
        getCurrentDocumentType() // This is now properly typed as DocumentType
      );
      setGeneratedContent(result.content);
    } finally {
      setLoading(false);
    }
  };

  // Load templates when tab changes
  useEffect(() => {
    loadTemplates();
  }, [activeTab]);

  const handleUpload = () => {
    setLoading(true);
    // TODO: Implémenter l'upload de document
    setLoading(false);
  };

  return (
    <Container size="lg" py="xl">
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Tab value="cv" leftSection={<IconFileText size="0.8rem" />}>CV</Tabs.Tab>
          <Tabs.Tab value="cover_letter" leftSection={<IconFileDescription size="0.8rem" />}>Lettre de motivation</Tabs.Tab>
          <Tabs.Tab value="portfolio" leftSection={<IconFileDescription size="0.8rem" />}>Portfolio</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cv" pt="xl">
          <DocumentTab
            templates={templates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            generatedContent={generatedContent}
            setGeneratedContent={setGeneratedContent}
            generateDocument={generateDocument}
            isLoading={loading}
            onUpload={handleUpload}
          />
        </Tabs.Panel>

        <Tabs.Panel value="cover_letter" pt="xl">
          <DocumentTab
            templates={templates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            generatedContent={generatedContent}
            setGeneratedContent={setGeneratedContent}
            generateDocument={generateDocument}
            isLoading={loading}
            onUpload={handleUpload}
          />
        </Tabs.Panel>

        <Tabs.Panel value="portfolio" pt="xl">
          <DocumentTab
            templates={templates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            generatedContent={generatedContent}
            setGeneratedContent={setGeneratedContent}
            generateDocument={generateDocument}
            isLoading={loading}
            onUpload={handleUpload}
          />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

interface DocumentTabProps {
  templates: DocumentTemplate[];
  selectedTemplate: string | null;
  setSelectedTemplate: (value: string | null) => void;
  generatedContent: string;
  setGeneratedContent: (content: string) => void;
  generateDocument: () => Promise<void>;
  isLoading: boolean;
  onUpload: () => void;
}

function DocumentTab({
  templates,
  selectedTemplate,
  setSelectedTemplate,
  generatedContent,
  setGeneratedContent,
  generateDocument,
  isLoading,
  onUpload
}: DocumentTabProps) {
  return (
    <Stack gap="md">
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Select
            label="Modèle"
            placeholder="Sélectionnez un modèle"
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            data={templates.map(t => ({ value: t.id.toString(), label: t.name }))}
            disabled={isLoading}
          />
          <Button
            leftSection={<IconDownload size="1rem" />}
            onClick={generateDocument}
            loading={isLoading}
            disabled={!selectedTemplate}
          >
            Générer
          </Button>
        </Group>

        <Textarea
          label="Contenu généré"
          value={generatedContent}
          onChange={(e) => setGeneratedContent(e.currentTarget.value)}
          minRows={10}
          disabled={isLoading}
        />
      </Card>

      <Group justify="flex-end">
        <Button
          leftSection={<IconUpload size="1rem" />}
          onClick={onUpload}
          loading={isLoading}
        >
          Télécharger
        </Button>
      </Group>
    </Stack>
  );
}