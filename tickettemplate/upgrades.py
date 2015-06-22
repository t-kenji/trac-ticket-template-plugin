# -*- coding: utf-8 -*-
#
# Copyright (C) 2008-2013 Richard Liao <richard.liao.i@gmail.com>
# All rights reserved.
#
# This software is licensed as described in the file COPYING, which
# you should have received as part of this distribution.
#


"""Automated upgrades for the tt database tables, and other data stored
in the Trac environment."""

import base64
import os
from stat import *


def add_tt_table(env, db):
    """Migrate from template files to db."""

    # detect existing templates files
    allTmpls = _findAllTmpls(env)
    allTmpls.sort(_cmp)

    # import into db
    for tt_name in allTmpls:
        tt_text = _loadTemplateText(env, tt_name)
        modi_time = _getMTime(tt_name)

        from tickettemplate.model import TT_Template
        TT_Template.insert(env, tt_name, tt_text, modi_time)

    # base64
    # detect existing templates files
    allTmpls = _findAllTmplsBase64(env)
    allTmpls.sort(_cmpBase64)

    # import into db
    for tt_name in allTmpls:
        tt_text = _loadTemplateTextBase64(env, tt_name)
        modi_time = _getMTimeBase64(tt_name)

        from tickettemplate.model import TT_Template
        tt_name = base64.decodestring(tt_name).decode('utf-8')
        TT_Template.insert(env, tt_name, tt_text, modi_time)


def _cmp(tt_name1, tt_name2):
    modi_time1 = _getMTime(tt_name1)
    modi_time2 = _getMTime(tt_name2)

    if modi_time1 < modi_time2:
        return 1
    elif modi_time1 > modi_time2:
        return -1
    else:
        return 0


def _cmpBase64(tt_name1, tt_name2):
    modi_time1 = _getMTimeBase64(tt_name1)
    modi_time2 = _getMTimeBase64(tt_name2)

    if modi_time1 < modi_time2:
        return 1
    elif modi_time1 > modi_time2:
        return -1
    else:
        return 0


def _getMTime(tt_name):
    tt_file = _getTTFilePath(tt_name)
    mtime = int(os.stat(tt_file)[ST_MTIME])
    return mtime


def _getMTimeBase64(tt_name):
    tt_file = _getTTFilePath(tt_name)
    mtime = int(os.stat(tt_file)[ST_MTIME])
    return mtime


def _findAllTmpls(env):
    """ find all templates in trac environment
    """
    allTmpls = []

    basePath = os.path.join(env.path, 'templates')
    files = os.listdir(basePath)
    for file in files:
        if file.startswith('description_') and file.endswith('.tmpl'):
            tt_name_base64 = file.split('description_',1)[1] \
                                 .rsplit('.tmpl', 1)[0]
            # if tt_name can't decode by base64, then it's normal name
            try:
                base64.decodestring(tt_name_base64).decode('utf-8')
                # skip this file
                continue
            except:
                allTmpls.append(tt_name_base64)

    return allTmpls


def _findAllTmplsBase64(env):
    """ find all templates in trac environment
    """
    allTmplsBase64 = []

    basePath = os.path.join(env.path, 'templates')
    files = os.listdir(basePath)
    for file in files:
        if file.startswith('description_') and file.endswith('.tmpl'):
            tt_name_base64 = file.split('description_',1)[1] \
                             .rsplit('.tmpl', 1)[0]
            try:
                base64.decodestring(tt_name_base64).decode('utf-8')
            except:
                continue

            allTmplsBase64.append(tt_name_base64)
    return allTmplsBase64


def _getTTFilePath(env, tt_name):
    """ get ticket template file path
    """
    tt_file_name = 'description_%s.tmpl' % tt_name
    tt_file = os.path.join(env.path, 'templates', tt_file_name)
    return tt_file


def _loadTemplateText(env, tt_name):
    """ load ticket template text from file.
    """
    tt_file = _getTTFilePath(env, tt_name)

    try:
        fp = open(tt_file, 'r')
        tt_text = fp.read()
        fp.close()
    except:
        tt_text = ""
    return tt_text


def _loadTemplateTextBase64(env, tt_name):
    """ load ticket template text from file.
    """
    tt_file = _getTTFilePath(env, tt_name)

    try:
        fp = open(tt_file, 'r')
        tt_text = fp.read()
        fp.close()
    except:
        tt_text = ""
    return tt_text


def add_tt_custom(env, db):
    """Add table tt_custom."""
    from trac.db import DatabaseManager

    connector, _ = DatabaseManager(env)._get_connector()
    # cursor = db.cursor()
    # table = schema[0]
    # for stmt in connector.to_sql(table):
        # cursor.execute(stmt)

map = {
    1: [],
    2: [],
    3: [],
    4: [],
}
