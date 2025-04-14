import { useState, useEffect } from 'react';
import { Container, Tabs, Card, Button, Group, Select, Textarea, Stack, LoadingOverlay } from '@mantine/core';
import { IconFileText, IconFileDescription, IconMail, IconDownload } from '@tabler/icons-react';
import { llmService } from '../services/api';
import { useAppStore } from '../store';
import { DOCUMENT_TYPES, type DocumentType, type DocumentTemplate } from '../types';

export function DocumentsPage() {
  // Store activeTab as DocumentType to ensure type safety
  const [activeTab, setActiveTab] = useState<DocumentType>('cv');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const { isLoading, setLoading } = useAppStore();

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

  return (
    <Container size="xl" py="xl">
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Tab value="cv" leftSection={<IconFileText size={16} />}>
            CV
          </Tabs.Tab>
          <Tabs.Tab value="coverLetter" leftSection={<IconFileDescription size={16} />}>
            Cover Letter
          </Tabs.Tab>
          <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>
            Email
          </Tabs.Tab>
          <Tabs.Tab value="followUp" leftSection={<IconMail size={16} />}>
            Follow Up
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cv" pt="xl">
          <DocumentTab
            type="cv"
            templates={templates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            generatedContent={generatedContent}
            setGeneratedContent={setGeneratedContent}
            generateDocument={generateDocument}
            loadTemplates={loadTemplates}
            isLoading={isLoading}
          />
        </Tabs.Panel>

        <Tabs.Panel value="coverLetter" pt="xl">
          <DocumentTab
            type="coverLetter"
            templates={templates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            generatedContent={generatedContent}
            setGeneratedContent={setGeneratedContent}
            generateDocument={generateDocument}
            loadTemplates={loadTemplates}
            isLoading={isLoading}
          />
        </Tabs.Panel>

        <Tabs.Panel value="email" pt="xl">
          <DocumentTab
            type="email"
            templates={templates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            generatedContent={generatedContent}
            setGeneratedContent={setGeneratedContent}
            generateDocument={generateDocument}
            loadTemplates={loadTemplates}
            isLoading={isLoading}
          />
        </Tabs.Panel>

        <Tabs.Panel value="followUp" pt="xl">
          <DocumentTab
            type="followUp"
            templates={templates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            generatedContent={generatedContent}
            setGeneratedContent={setGeneratedContent}
            generateDocument={generateDocument}
            loadTemplates={loadTemplates}
            isLoading={isLoading}
          />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

interface DocumentTabProps {
  type: DocumentType;
  templates: DocumentTemplate[];
  selectedTemplate: string | null;
  setSelectedTemplate: (value: string | null) => void;
  generatedContent: string;
  setGeneratedContent: (content: string) => void;
  generateDocument: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  isLoading: boolean;
}

function DocumentTab({
  type,
  templates,
  selectedTemplate,
  setSelectedTemplate,
  generatedContent,
  setGeneratedContent,
  generateDocument,
  loadTemplates,
  isLoading
}: DocumentTabProps) {
  return (
    <Stack gap="md">
      <Group>
        <Select
          placeholder="Select template"
          data={templates.map(t => ({ value: t.id.toString(), label: t.name }))}
          value={selectedTemplate}
          onChange={setSelectedTemplate}
          style={{ width: 300 }}
        />
        <Button onClick={loadTemplates}>Refresh Templates</Button>
        <Button onClick={generateDocument}>
          Generate {type === 'cv' ? 'CV' : 
                  type === 'coverLetter' ? 'Cover Letter' : 
                  type === 'email' ? 'Email' : 'Follow Up'}
        </Button>
      </Group>

      {generatedContent && (
        <Card withBorder pos="relative">
          <LoadingOverlay visible={isLoading} />
          <Textarea
            value={generatedContent}
            onChange={(e) => setGeneratedContent(e.currentTarget.value)}
            autosize
            minRows={10}
          />
          <Group justify="flex-end" mt="md">
            <Button leftSection={<IconDownload size={16} />}>Download</Button>
          </Group>
        </Card>
      )}
    </Stack>
  );
}