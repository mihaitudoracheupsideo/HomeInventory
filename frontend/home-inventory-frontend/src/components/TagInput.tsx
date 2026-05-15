import { useEffect, useMemo, useState } from 'react';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import type { ITag } from '../types/ITag';
import { searchTags } from '../api/tagService';

type TagOption = ITag | { id: string; name: string; inputValue?: string };

interface TagInputProps {
  value: string[];
  label?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  onChange: (tags: string[]) => void;
}

const filter = createFilterOptions<TagOption>();

const normalizeTagName = (tagName: string) => tagName.trim().replace(/\s+/g, ' ');

const dedupeTagNames = (tagNames: string[]) => {
  const seen = new Set<string>();

  return tagNames.filter((tagName) => {
    const normalized = normalizeTagName(tagName);
    if (!normalized) {
      return false;
    }

    const key = normalized.toLocaleUpperCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  }).map(normalizeTagName);
};

const TagInput = ({
  value,
  label = 'Tags',
  placeholder = 'Add an existing tag or create a new one',
  helperText,
  disabled = false,
  onChange,
}: TagInputProps) => {
  const [options, setOptions] = useState<ITag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!inputValue.trim()) {
      setOptions([]);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchTags(inputValue.trim(), 10);
        if (!cancelled) {
          setOptions(response.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputValue]);

  const selectedOptions = useMemo<TagOption[]>(() => {
    return value.map((tagName, index) => ({
      id: `selected-${index}-${tagName}`,
      name: tagName,
    }));
  }, [value]);

  return (
    <Autocomplete<TagOption, true, false, true>
      multiple
      freeSolo
      disabled={disabled}
      options={options}
      value={selectedOptions}
      inputValue={inputValue}
      loading={loading}
      filterSelectedOptions
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(_event, newValue) => {
        const nextTagNames = dedupeTagNames(
          newValue.map((entry) => {
            if (typeof entry === 'string') {
              return entry;
            }

            if ('inputValue' in entry && entry.inputValue) {
              return entry.inputValue;
            }

            return entry.name;
          })
        );

        onChange(nextTagNames);
        setInputValue('');
      }}
      getOptionLabel={(option) => {
        if (typeof option === 'string') {
          return option;
        }

        return 'inputValue' in option && option.inputValue ? option.inputValue : option.name;
      }}
      isOptionEqualToValue={(option, selected) => option.name.toLocaleUpperCase() === selected.name.toLocaleUpperCase()}
      filterOptions={(availableOptions, params) => {
        const filtered = filter(availableOptions, params);
        const normalizedInput = normalizeTagName(params.inputValue);
        const exists = availableOptions.some(
          (option) => option.name.toLocaleUpperCase() === normalizedInput.toLocaleUpperCase()
        );

        if (normalizedInput && !exists) {
          filtered.push({
            id: `create-${normalizedInput}`,
            name: `Create "${normalizedInput}"`,
            inputValue: normalizedInput,
          });
        }

        return filtered;
      }}
      renderTags={(tagValues, getTagProps) =>
        tagValues.map((option, index) => {
          const tagProps = getTagProps({ index });
          const { key, ...chipProps } = tagProps;

          return (
            <Chip
              key={key}
              label={option.name}
              size="small"
              color="primary"
              variant="outlined"
              {...chipProps}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default TagInput;